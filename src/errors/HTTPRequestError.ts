const name = 'HTTPRequestError';

export class HTTPRequestError extends Error {
  httpStatus: number;
  constructor(httpStatus: number, message: string) {
    super();
    this.name = name;
    this.httpStatus = httpStatus;
    this.message = message;
  }
}

export const isHTTPRequestError = (err: any): err is HTTPRequestError =>
  err.name === name;
