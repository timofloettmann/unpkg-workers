import {
  allowedEntryValues,
  validateEntryParameter,
} from './validators/validateEntryParameter';
import { validatePackageName } from './validators/validatePackageName';
import { validateFilePath } from './validators/validateFilePath';
import { Environment, PackageEntryType } from './types';
import { isParameterValidationError } from './errors/ValidationError';
import {
  HTTPRequestError,
  isHTTPRequestError,
} from './errors/HTTPRequestError';
import { getCacheControlHeader } from './helpers/cache-control';
import { NPMClient } from './npm';
import getContentTypeHeader from './helpers/content-type';
import { resolvePackageEntry } from './helpers/resolve-package-entry';

/**
 * These routes match all possible combinations of short-hand requests, semver requests and full file requests
 * The only parameter that will always be included in the result is the `<packageAndVersion` parameter,
 * containing a value such as `test-package@latest`, however WITHOUT the `@company` scope!
 *
 * The `@company` scope will be optionally available on the `scope` parameter,
 * because it is separated with a slash and matching these together would complicate the RegExp (easier to combine later!)
 *
 * the `filePathOrEntry` parameter will include everything after the packageOrVersion parameter.
 * Meaning this can be either `main` / `unpkg` for the entry type,
 * OR it can be the full file path that should be served from the tarball.
 */
const routes = [
  /**
   * matches paths such as
   * `/@company/test-package`
   * `/@company/test-package@latest`
   * `/@company/test-package@2.0.0`
   */
  /^\/@(?<scope>[^/]+)\/(?<packageAndVersion>[^/]+)$/gm,

  /**
   * matches paths such as
   * `/@company/test-package@2.0.0/dist/index.js`
   * `/@company/test-package@latest/unpkg`
   */
  /^\/@(?<scope>[^/]+)\/(?<packageAndVersion>[^/]+)\/(?<filePathOrEntry>(.*))$/gm,

  /**
   * matches paths such as
   * `/test-package`
   * `/test-package@latest`
   */
  /^\/(?<packageAndVersion>[^/]+)$/gm,

  /**
   * matches paths such as
   * `/test-package@2.0.0/dist/index.js`
   * `/test-package@latest/unpkg`
   */
  /^\/(?<packageAndVersion>[^/]+)\/(?<filePathOrEntry>(.*))$/gm,
];

type MatchParams = {
  scope?: string;
  packageAndVersion: string;
  filePathOrEntry?: string;
};

const parseRequestParams = (pathname: string) => {
  const decodedPath = decodeURIComponent(pathname);
  const results = routes
    .map((regexp) => {
      const result = decodedPath.matchAll(regexp).next().value;
      if (result) {
        return result.groups;
      }
      return null;
    })
    .filter((x) => x !== null);

  const matchParams: MatchParams = results[0];

  const [packageName, requestedVersion = 'latest'] =
    matchParams.packageAndVersion.split('@');
  const requestedPackage = matchParams.scope
    ? `@${matchParams.scope}/${packageName}`
    : packageName;
  const requestedFile = matchParams.filePathOrEntry || 'main';

  return { requestedPackage, requestedVersion, requestedFile };
};

const handleRequest = async (
  req: Request,
  env: Environment,
): Promise<Response> => {
  const parsedURL = new URL(req.url);

  const { requestedPackage, requestedVersion, requestedFile } =
    parseRequestParams(parsedURL.pathname);

  const npmClient = new NPMClient({
    registryUrl: env.REGISTRY_URL,
    registryUsername: env.REGISTRY_USERNAME,
    registryPassword: env.REGISTRY_PASSWORD,
  });

  if (allowedEntryValues.includes(requestedFile)) {
    /**
     * the request is a shorthand request like `/test-package@2.0.0` or simply `/test-package`
     * which will redirect to the actual entry path
     */

    validateEntryParameter(requestedFile);
    validatePackageName(requestedPackage);

    const { fullPathname, exactVersionMatch } = await resolvePackageEntry(
      npmClient,
      requestedFile as PackageEntryType,
      requestedPackage,
      requestedVersion,
    );

    const { protocol, hostname } = parsedURL;

    return new Response(null, {
      status: exactVersionMatch ? 301 : 302,
      headers: {
        Location: `${protocol}//${hostname}/${fullPathname}`,
        'Cache-Control': getCacheControlHeader(302),
      },
    });
  } else {
    validatePackageName(requestedPackage);
    validateFilePath(requestedFile);

    const file = await npmClient.readFileFromPackage(
      requestedPackage,
      requestedVersion,
      requestedFile,
    );

    if (file === null) {
      throw new HTTPRequestError(
        404,
        `File "${requestedFile}" not found in tarball of ${requestedPackage}@${requestedVersion}`,
      );
    }

    const [filename] = requestedFile.split('/').reverse();
    return new Response(file.contents, {
      headers: {
        'Content-Type': getContentTypeHeader(filename),
        'Cache-Control': getCacheControlHeader(200),
      },
    });
  }
};

const errorHandler = (error: any) => {
  if (isHTTPRequestError(error)) {
    return new Response(JSON.stringify(error), {
      status: error.httpStatus,
      statusText: error.message,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': getCacheControlHeader(error.httpStatus),
      },
    });
  } else if (isParameterValidationError(error)) {
    return new Response(JSON.stringify(error), {
      status: 400,
      statusText: error.message,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response(error.message || 'Server Error', {
    status: 500,
  });
};

export default {
  fetch: async (req: Request, env: Environment) => {
    const url = new URL(req.url);
    const cache = caches.default;

    const cacheKey = `${url.protocol}//${url.hostname}${url.pathname}`;

    const cached = await cache.match(cacheKey);

    if (cached) {
      return cached.clone();
    }

    const response = await handleRequest(req, env).catch(errorHandler);

    await cache.put(cacheKey, response.clone());

    return response;
  },
};
