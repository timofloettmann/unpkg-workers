import pako from 'pako';
import { untar } from 'tinytar';
import type { FileDescriptor } from 'tinytar';
import type { DistributionInfo, DistTagsObject, PackageInfo } from './types';
import { ensureBeginningSlash, removeTrailingSlash } from '../helpers/path';

type NPMClientOptions = {
  registryUrl: string;
  registryUsername?: string;
  registryPassword?: string;
};

const mergeWithDefaults = (
  options: Partial<NPMClientOptions>,
): NPMClientOptions => {
  return {
    ...options,
    registryUrl: removeTrailingSlash(
      options.registryUrl || 'https://registry.npmjs.org',
    ),
  };
};

type VersionAndTagsList = {
  versions: Array<string>;
  tags: DistTagsObject;
};

export class NPMClient {
  #options: NPMClientOptions;

  constructor(options: Partial<NPMClientOptions> = {}) {
    const mergedOptions = mergeWithDefaults(options);

    this.#options = mergedOptions;
  }

  #fetchAuthenticated = async (
    url: string | Request,
    args?: Request | RequestInit,
  ): Promise<Response> => {
    const headers = Object.assign(
      {},
      args?.headers,
      this.#options.registryUsername && this.#options.registryPassword
        ? {
            Authorization: `Basic ${btoa(
              `${this.#options.registryUsername}:${
                this.#options.registryPassword
              }`,
            )}`,
          }
        : {},
    );

    const startTime = Date.now();

    const cache = await caches.open('npm');
    const cached = await cache.match(url);

    if (cached) {
      console.log(`[NPM-Cache] HIT: ${url}`);
      return cached.clone();
    } else {
      console.log(`[NPM-Cache] MISS: ${url}`);
    }

    const res = await fetch(url, {
      ...args,
      headers,
      redirect: 'manual',
    });

    const location = res.headers.get('Location');
    if (location) {
      return await fetch(location, args);
    }

    const endTime = Date.now();
    console.log(
      `[Fetch] completed with status code ${res.status} (${
        res.statusText
      }), took ${endTime - startTime}ms`,
    );

    await cache.put(url, res.clone());

    return res;
  };

  #fetchPackageInfo = async (
    packageName: string,
    version?: string,
  ): Promise<PackageInfo | null> => {
    const infoURL = `${removeTrailingSlash(
      this.#options.registryUrl,
    )}/${packageName}/${version ? version : ''}`;

    const res = await this.#fetchAuthenticated(infoURL, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const response = await res.json<PackageInfo>();

      return {
        // reminder: the type used only includes what we're actually using.
        // NPM returns a number of additional properties that aren't interesting for us.
        versions: response.versions,
        'dist-tags': response['dist-tags'],
      };
    } else {
      return null;
    }
  };

  getVersionsAndTags = async (
    packageName: string,
  ): Promise<VersionAndTagsList | null> => {
    const value = await this.#fetchPackageInfo(packageName);

    if (value === null) {
      return null;
    }

    return { versions: Object.keys(value.versions), tags: value['dist-tags'] };
  };

  #getDistForPackageVersion = async (
    packageName: string,
    version: string,
  ): Promise<DistributionInfo | null> => {
    const packageInfo = await this.#fetchPackageInfo(packageName);

    if (packageInfo === null) {
      return null;
    }

    if (!(version in packageInfo.versions)) {
      return null;
    }

    const { dist } = packageInfo.versions[version];

    return dist;
  };

  getPackageContents = async (
    packageName: string,
    version: string,
  ): Promise<FileDescriptor[] | null> => {
    const dist = await this.#getDistForPackageVersion(packageName, version);
    if (dist === null) {
      console.log(`[NPM] Dist not found for ${packageName}@${version}`);
      return null;
    }

    const tarballURL = dist.tarball;
    const res = await this.#fetchAuthenticated(tarballURL, {
      headers: {
        Accept: 'application/octet-stream',
      },
    });

    if (!res.ok) {
      return null;
    }

    const buffer = await res.arrayBuffer();
    const decompressed = pako.inflate(new Uint8Array(buffer));

    return untar(decompressed);
  };

  readFileFromPackage = async (
    packageName: string,
    version: string,
    filePath: string,
  ): Promise<{ contents: string; meta: FileDescriptor } | null> => {
    const contents = await this.getPackageContents(packageName, version);
    if (contents === null) {
      // dist not found for version
      return null;
    }

    const file = contents.find(({ name }) => {
      return (
        // packages have a "package/" directory inside the tarball,
        // so the paths here are all `package/dist/index.js`
        // instead of `dist/index.js` like it would be found in the package.json
        ensureBeginningSlash(name.replace(/^[^/]+/g, '')) ===
        ensureBeginningSlash(filePath)
      );
    });

    if (!file) {
      return null;
    }

    const decoder = new TextDecoder();
    return { contents: decoder.decode(new Uint8Array(file.data)), meta: file };
  };
}
