import worker from '../src/worker';
import { server } from './_util/servers/default-registry';
import { testEntryFilePath, testHost, testPackageName } from './_util/vars';

const defaultEnv = {};

const handleRequest = worker.fetch;

describe('semver redirects', () => {
  beforeAll(() => {
    server.listen();
  });
  afterAll(() => {
    server.close();
  });
  it('should redirect to latest version by default', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${testPackageName}`, {
        method: 'GET',
      }),
      defaultEnv,
    );
    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${testPackageName}@2.0.0/${testEntryFilePath}`,
    );
  });

  it(`~1.1.0 should 302 redirect to 1.1.1`, async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${testPackageName}@~1.1.0`, {
        method: 'GET',
      }),
      defaultEnv,
    );
    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${testPackageName}@1.1.1/${testEntryFilePath}`,
    );
  });

  it('^1.0.0 should 302 redirect to 1.1.1', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${testPackageName}@^1.0.0`, {
        method: 'GET',
      }),
      defaultEnv,
    );

    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${testPackageName}@1.1.1/${testEntryFilePath}`,
    );
  });

  it('version @2 should 302 redirect to 2.0.0', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${testPackageName}@2`, {
        method: 'GET',
      }),
      defaultEnv,
    );
    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${testPackageName}@2.0.0/${testEntryFilePath}`,
    );
  });

  it('exact version should 301 redirect', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${testPackageName}@1.0.0`, {
        method: 'GET',
      }),
      defaultEnv,
    );

    expect(result.status).toEqual(301);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${testPackageName}@1.0.0/${testEntryFilePath}`,
    );
  });

  describe('dist-tag', () => {
    it('@next should 302 redirect to 3.0.0-rc.0', async () => {
      const result = await handleRequest(
        new Request(`${testHost}/main/${testPackageName}@next`, {
          method: 'GET',
        }),
        defaultEnv,
      );
      expect(result.status).toEqual(302);
      expect(result.headers.get('location')).toEqual(
        `${testHost}/${testPackageName}@3.0.0-rc.0/${testEntryFilePath}`,
      );
    });

    it('@latest should 302 redirect to 2.0.0', async () => {
      const result = await handleRequest(
        new Request(`${testHost}/main/${testPackageName}@latest`, {
          method: 'GET',
        }),
        defaultEnv,
      );
      expect(result.status).toEqual(302);
      expect(result.headers.get('location')).toEqual(
        `${testHost}/${testPackageName}@2.0.0/${testEntryFilePath}`,
      );
    });
  });
});
