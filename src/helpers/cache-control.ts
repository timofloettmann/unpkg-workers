const CACHE_CONTROL = {
  NO_CACHE: `public, no-cache`,
  NOT_FOUND: `public, max-age=60`, // one minute
  PERMANENT: `public, max-age=31536000`, // one year
  TEMPORARY_REDIRECT: `public, max-age=300`, // five minutes
};

export const getCacheControlHeader = (httpStatus: number): string => {
  switch (httpStatus) {
    case 200:
      return CACHE_CONTROL.PERMANENT;
    case 301:
      return CACHE_CONTROL.PERMANENT;
    case 302:
      return CACHE_CONTROL.TEMPORARY_REDIRECT;
    case 400:
      return CACHE_CONTROL.NO_CACHE;
    case 404:
      return CACHE_CONTROL.NOT_FOUND;
    case 500:
      return CACHE_CONTROL.NO_CACHE;
    default:
      return `public, max-age=60`; // Cache everything we haven't covered for one minute?
  }
};
