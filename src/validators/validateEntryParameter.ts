import { ParameterValidationError } from '../errors/ValidationError';
import { PackageEntryType } from '../types';

/**
 * Validates that the `entry` parameter exists and is one of the following values: "unpkg" or "main"
 * Responds with a HTTP 400 if this validation fails
 */

export const allowedEntryValues = ['main', 'unpkg'];

export const validateEntryParameter = (
  entry: any,
): entry is PackageEntryType => {
  if (!entry || !allowedEntryValues.includes(entry)) {
    throw new ParameterValidationError(
      `Invalid "entry". Got ${entry}, expected one of: ${allowedEntryValues.join(
        ', ',
      )}`,
    );
  }

  return true;
};
