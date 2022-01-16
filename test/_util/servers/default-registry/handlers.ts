import { rest } from 'msw';
import {
  defaultRegistryUrl,
  scopedTestPackageName,
  testPackageName,
  versions,
  resolveDataFile,
} from '../../vars';

export const handlers = [
  // using defaultRegistryUrl
  rest.get(`${defaultRegistryUrl}/${testPackageName}`, (req, res, ctx) => {
    return res(
      ctx.json(require(resolveDataFile('default-registry-test-package.json'))),
    );
  }),
  // scoped package using defaultRegistryUrl
  rest.get(
    `${defaultRegistryUrl}/${scopedTestPackageName}`,
    (req, res, ctx) => {
      return res(
        ctx.json(
          require(resolveDataFile('default-registry-scoped-test-package.json')),
        ),
      );
    },
  ),
  ...versions.map((version) =>
    rest.get(
      `${defaultRegistryUrl}/${testPackageName}/-/${testPackageName}-${version}.tgz`,
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
  // scoped package tarball URLs
  ...versions.map((version) =>
    rest.get(
      `${defaultRegistryUrl}/${scopedTestPackageName}/-/${testPackageName}-${version}.tgz`,
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
