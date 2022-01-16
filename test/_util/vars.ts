import path from 'path';

export const testHost = 'https://unpkg-workers.dev';

export const defaultRegistryUrl = 'https://registry.npmjs.org';
export const authProtectedCustomRegistryUrl =
  'https://company.jfrog.io/api/npm/npm';

export const authProtectedCustomRegistryUsername = 'user';
export const authProtectedCustomRegistryPassword = 'passwd';

export const testPackageName = 'test-package';
export const scopedTestPackageName = `@company/${testPackageName}`;
export const versions = ['1.0.0', '1.1.0', '1.1.1', '2.0.0', '3.0.0-rc.0'];
export const testEntryFilePath = 'dist/production.js';
export const jfrogS3tarballBaseUrl =
  'https://jfrog-prod-euc1-shared-frankfurt-main.s3.amazonaws.com/company/filestore';

export const resolveDataFile = (file: string) =>
  path.resolve(path.join(__dirname, './data', file));
