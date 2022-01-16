import worker from '../src/worker';
import { server } from './_util/servers/default-registry';
import {
  scopedTestPackageName,
  testEntryFilePath,
  testHost,
} from './_util/vars';

const defaultEnv = {};

const handleRequest = worker.fetch;

describe('scoped packages', () => {
  beforeAll(() => {
    server.listen();
  });
  afterAll(() => {
    server.close();
  });

  it('should redirect to latest version', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/main/${scopedTestPackageName}`, {
        method: 'GET',
      }),
      defaultEnv,
    );
    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      `${testHost}/${scopedTestPackageName}@2.0.0/${testEntryFilePath}`,
    );
  });

  it('should be able to serve a file from a scoped package', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/${scopedTestPackageName}@2.0.0/README.md`, {
        method: 'GET',
      }),
      defaultEnv,
    );

    expect(result.status).toEqual(200);
    expect(result.headers.get('content-type')).toEqual('text/markdown');
  });
});
