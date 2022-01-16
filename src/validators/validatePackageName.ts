import validateNpmPackageName from 'validate-npm-package-name';
import { ParameterValidationError } from '../errors/ValidationError';

const hexValue = /^[a-f0-9]+$/i;
function isHash(value: string) {
  return value.length === 32 && hexValue.test(value);
}

export const validatePackageName = (packageName: string) => {
  if (isHash(packageName)) {
    throw new ParameterValidationError(
      `Invalid package name "${packageName}" (cannot be a hash)`,
    );
  }

  const errors = validateNpmPackageName(packageName).errors;

  if (errors) {
    throw new ParameterValidationError(
      `Invalid package name "${packageName}" (${errors.join(', ')})`,
    );
  }
};
