import { ParameterValidationError } from '../errors/ValidationError';

export const validateFilePath = (filePath: string) => {
  if (filePath === '/') {
    throw new ParameterValidationError(`File path ${filePath} is not allowed`);
  }
};
