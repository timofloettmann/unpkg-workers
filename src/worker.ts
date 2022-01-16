import { validateEntryParameter } from './validators/validateEntryParameter';
import { validatePackageName } from './validators/validatePackageName';
import { validateFilePath } from './validators/validateFilePath';
import { Environment } from './types';
import { isParameterValidationError } from './errors/ValidationError';
import {
  HTTPRequestError,
  isHTTPRequestError,
} from './errors/HTTPRequestError';
import { getCacheControlHeader } from './helpers/cache-control';
import { parseRequestParams } from './helpers/parse-request-params';
import { NPMClient } from './npm';
import getContentTypeHeader from './helpers/content-type';
import { resolvePackageEntry } from './helpers/resolve-package-entry';

const handleRequest = async (
  req: Request,
  env: Environment,
): Promise<Response> => {
  const route = /^\/(?<entry>(main|module|unpkg))?\/?(?<request>.*)$/gm;
  const parsedURL = new URL(req.url);
  const match = parsedURL.pathname.matchAll(route).next().value;

  if (!match) {
    return new Response(null, { status: 404 });
  }

  const params = parseRequestParams(decodeURIComponent(parsedURL.pathname));

  const npmClient = new NPMClient({
    registryUrl: env.REGISTRY_URL,
    registryUsername: env.REGISTRY_USERNAME,
    registryPassword: env.REGISTRY_PASSWORD,
  });

  if ('entryType' in params) {
    /**
     * the request is a shorthand request like `/main/test-package@2.0.0` or simply `/main/test-package`
     * which will redirect to the actual entry path
     */

    validateEntryParameter(params.entryType);
    validatePackageName(params.package);

    const { fullPathname, exactVersionMatch } = await resolvePackageEntry(
      npmClient,
      params.entryType,
      params.package,
      params.version,
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
    validatePackageName(params.package);
    validateFilePath(params.file);

    const file = await npmClient.readFileFromPackage(
      params.package,
      params.version,
      params.file,
    );

    if (file === null) {
      throw new HTTPRequestError(
        404,
        `File "${params.file}" not found in tarball of ${params.package}@${params.version}`,
      );
    }

    const [filename] = params.file.split('/').reverse();
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
