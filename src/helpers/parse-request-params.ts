import { PackageEntryType } from '../types';
import { allowedEntryValues } from '../validators/validateEntryParameter';
import { removeBeginningSlash } from './path';

export type ShortHandRequestParametersType = {
  entryType: PackageEntryType;
  package: string;
  version: string;
};

export type FileRequestParametersType = {
  package: string;
  version: string;
  file: string;
};

const parseShortHandRequestParams = (
  pathname: string,
): ShortHandRequestParametersType => {
  const [entryType, scopeOrPackage, packageIfScoped] = pathname.split('/');
  const scope = scopeOrPackage.startsWith('@') ? scopeOrPackage : null;

  const [packageName, version = 'latest'] =
    scope === null ? scopeOrPackage.split('@') : packageIfScoped.split('@');

  return {
    entryType: entryType as PackageEntryType,
    package: scope === null ? packageName : `${scope}/${packageName}`,
    version: version,
  };
};

const isString = (arg: any): arg is string => typeof arg === 'string';

const parseFileRequestParams = (
  pathname: string,
): FileRequestParametersType => {
  const isScopedPackage = pathname.startsWith('@');

  const [scope, packageAndVersion, ...rest] = isScopedPackage
    ? pathname.split('/')
    : [null, ...pathname.split('/')];

  const [packageName, version] =
    isString(packageAndVersion) && packageAndVersion.indexOf('@') !== -1
      ? packageAndVersion.split('@')
      : [packageAndVersion, 'latest'];

  const requestedPath = rest.length > 0 ? rest.join('/') : '/';

  return {
    package: scope === null ? packageName! : `${scope}/${packageName}`,
    version: version,
    file: requestedPath,
  };
};

export const parseRequestParams = (pathname: string) => {
  const cleanedPath = removeBeginningSlash(pathname);
  const isShortHand = allowedEntryValues.some((e) => cleanedPath.startsWith(e));
  return isShortHand
    ? parseShortHandRequestParams(cleanedPath)
    : parseFileRequestParams(cleanedPath);
};
