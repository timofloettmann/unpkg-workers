export const ensureBeginningSlash = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;

export const removeBeginningSlash = (path: string) =>
  path.startsWith('/') ? path.substring(1) : path;

export const removeTrailingSlash = (str: string) =>
  str.endsWith('/') ? str.slice(0, -1) : str;
