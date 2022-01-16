const name = 'ParameterValidationError';

export class ParameterValidationError extends Error {
  constructor(message: string) {
    super();
    this.name = name;
    this.message = message;
  }
}

export const isParameterValidationError = (
  err: any,
): err is ParameterValidationError => err.name === name;
