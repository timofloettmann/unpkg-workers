import worker from '../src/worker';
import { server } from './_util/servers/jfrog-custom-registry';
import {
  authProtectedCustomRegistryPassword,
  authProtectedCustomRegistryUrl,
  authProtectedCustomRegistryUsername,
  jfrogS3tarballBaseUrl,
  testHost,
  testPackageName,
} from './_util/vars';

const handleRequest = worker.fetch;

const expectedBasicAuth = `Basic ${Buffer.from(
  `${authProtectedCustomRegistryUsername}:${authProtectedCustomRegistryPassword}`,
  'binary',
).toString('base64')}`;

describe('custom registry / jfrog', () => {
  beforeAll(() => {
    server.listen();
  });
  afterAll(() => {
    server.close();
  });

  it('should fetch using custom registry configuration', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await handleRequest(
      new Request(`${testHost}/${testPackageName}@2.0.0/README.md`, {
        method: 'GET',
      }),
      {
        REGISTRY_URL: authProtectedCustomRegistryUrl,
        REGISTRY_USERNAME: authProtectedCustomRegistryUsername,
        REGISTRY_PASSWORD: authProtectedCustomRegistryPassword,
      },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      `${authProtectedCustomRegistryUrl}/${testPackageName}/`,
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: expectedBasicAuth,
        },
      }),
    );

    expect(result.status).toEqual(200);
  });

  /**
   * JFROG requires a Basic Auth header but then redirects to an AWS S3 URL
   * which already includes the AMZ auth token as query parameter
   * Following redirects automatically as `fetch` would do by default causes the Authorization header
   * to be set on those requests as well and then AWS S3 returns an error
   * that there are multiple authentication methods being used
   */
  it('should fetch tarball from AWS S3 without Authorization header', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await handleRequest(
      new Request(`${testHost}/${testPackageName}@2.0.0/README.md`, {
        method: 'GET',
      }),
      {
        REGISTRY_URL: authProtectedCustomRegistryUrl,
        REGISTRY_USERNAME: authProtectedCustomRegistryUsername,
        REGISTRY_PASSWORD: authProtectedCustomRegistryPassword,
      },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      `${authProtectedCustomRegistryUrl}/test-package/`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: expectedBasicAuth,
        },
        redirect: 'manual',
      },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      `${authProtectedCustomRegistryUrl}/test-package/-/test-package-2.0.0.tgz`,
      {
        headers: {
          Accept: 'application/octet-stream',
          Authorization: expectedBasicAuth,
        },
        redirect: 'manual',
      },
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      `${jfrogS3tarballBaseUrl}/${testPackageName}-2.0.0.tgz`,
      {
        headers: {
          Accept: 'application/octet-stream',
        },
      },
    );

    expect(result.status).toEqual(200);
  });
});
