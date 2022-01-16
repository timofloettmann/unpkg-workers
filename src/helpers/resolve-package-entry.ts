import { NPMClient } from '../npm';
import { resolveSemverVersion } from './semver';
import type { PackageEntryType } from '../types';
import { HTTPRequestError } from '../errors/HTTPRequestError';
import { ensureBeginningSlash } from './path';

export const resolvePackageEntry = async (
  npmClient: NPMClient,
  requestedPackageEntryType: PackageEntryType,
  packageName: string,
  requestedVersion = 'latest',
) => {
  const packageInfo = await npmClient.getVersionsAndTags(packageName);

  if (!packageInfo) {
    throw new HTTPRequestError(404, `Package ${packageName} not found`);
  }

  const resolvedVersion = resolveSemverVersion(
    packageInfo.versions,
    packageInfo.tags,
    requestedVersion,
  );

  if (resolvedVersion === null) {
    throw new HTTPRequestError(
      404,
      `Version "${requestedVersion}" not found in ${packageName}`,
    );
  }

  const packageJsonFile = await npmClient.readFileFromPackage(
    packageName,
    resolvedVersion,
    '/package.json',
  );

  if (!packageJsonFile) {
    throw new HTTPRequestError(
      404,
      `package.json not found in ${packageName}@${resolvedVersion}`,
    );
  }

  const parsedPackageJson = JSON.parse(packageJsonFile.contents);

  if (!parsedPackageJson[requestedPackageEntryType]) {
    throw new HTTPRequestError(
      404,
      `"${requestedPackageEntryType}" not found in ${packageName}@${resolvedVersion}`,
    );
  }

  return {
    fullPathname: `${packageName}@${resolvedVersion}${ensureBeginningSlash(
      parsedPackageJson[requestedPackageEntryType],
    )}`,
    exactVersionMatch: resolvedVersion === requestedVersion,
  };
};
