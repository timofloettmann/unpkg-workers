import worker from '../src/worker';
import { server } from './_util/servers/default-registry';
import { testEntryFilePath, testHost, testPackageName } from './_util/vars';

const defaultEnv = {};

const handleRequest = worker.fetch;

describe('file serving', () => {
  beforeAll(() => {
    server.listen();
  });
  afterAll(() => {
    server.close();
  });

  it('should respond with the correct Content-Type for .mjs', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/${testPackageName}@2.0.0/${testEntryFilePath}`, {
        method: 'GET',
      }),
      defaultEnv,
    );

    expect(result.status).toEqual(200);
    expect(result.headers.get('content-type')).toEqual('text/javascript');
  });

  it('should respond with the correct Content-Type for .md', async () => {
    const result = await handleRequest(
      new Request(`${testHost}/${testPackageName}@2.0.0/README.md`, {
        method: 'GET',
      }),
      defaultEnv,
    );

    expect(result.status).toEqual(200);
    expect(result.headers.get('content-type')).toEqual('text/markdown');
  });
});
