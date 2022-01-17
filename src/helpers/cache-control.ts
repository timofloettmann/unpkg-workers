const CACHE_CONTROL = {
  NO_CACHE: `public, no-cache`,
  NOT_FOUND: `public, s-maxage=60`, // one minute
  PERMANENT: `public, s-maxage=31536000, immutable`, // one year
  TEMPORARY_REDIRECT: `public, s-maxage=300`, // five minutes
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
      return `public, s-maxage=60`; // Cache everything we haven't covered for one minute?
  }
};
