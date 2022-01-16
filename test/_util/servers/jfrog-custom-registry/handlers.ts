import { rest, RestRequest } from 'msw';
import {
  authProtectedCustomRegistryPassword,
  authProtectedCustomRegistryUrl,
  authProtectedCustomRegistryUsername,
  jfrogS3tarballBaseUrl,
  versions,
  resolveDataFile,
} from '../../vars';

const assertCustomRegistryAuth = (req: RestRequest) => {
  const expectedBasicAuth = `Basic ${Buffer.from(
    `${authProtectedCustomRegistryUsername}:${authProtectedCustomRegistryPassword}`,
    'binary',
  ).toString('base64')}`;

  if (req.headers.get('authorization') !== expectedBasicAuth) {
    throw new Error(
      `Invalid Authorization Header for ${authProtectedCustomRegistryUrl}`,
    );
  }
};

export const handlers = [
  // using authProtectedCustomRegistryUrl
  rest.get(
    `${authProtectedCustomRegistryUrl}/test-package`,
    (req, res, ctx) => {
      assertCustomRegistryAuth(req);

      return res(
        ctx.json(
          require(resolveDataFile(
            'auth-protected-custom-registry-test-package.json',
          )),
        ),
      );
    },
  ),

  rest.get(
    `${authProtectedCustomRegistryUrl}/test-package/`,
    (req, res, ctx) => {
      return res(
        ctx.json(
          require(resolveDataFile(
            'auth-protected-custom-registry-test-package.json',
          )),
        ),
      );
    },
  ),
  ...versions.map((version) =>
    rest.get(
      `${authProtectedCustomRegistryUrl}/test-package/-/test-package-${version}.tgz`,
      (req, res, ctx) => {
        return res(
          ctx.status(302),
          ctx.set(
            'Location',
            `${jfrogS3tarballBaseUrl}/test-package-${version}.tgz`,
          ),
        );
      },
    ),
  ),

  ...versions.map((version) =>
    rest.get(
      `${jfrogS3tarballBaseUrl}/test-package-${version}.tgz`,
      (req, res, ctx) => {
        const tgzBuffer = new Uint8Array(
          require('fs').readFileSync(
            resolveDataFile('test-package-*.tgz'),
            null,
          ),
        ).buffer;

        return res(
          ctx.set('Content-Length', tgzBuffer.byteLength.toString()),
          ctx.set('Content-Type', 'application/octet-stream'),
          ctx.body(tgzBuffer),
        );
      },
    ),
  ),
];
