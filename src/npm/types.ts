export type DistTagsObject = { latest: string } & { [tag: string]: string };

export type DistributionInfo = { tarball: string; shasum: string };

/**
 * The Response type of requests to registry.npmjs.org/<package>
 *
 * This type only includes properties that are actually used by us.
 * See more here: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */

export type VersionInfo = {
  name: string;
  version: string;
  dist: DistributionInfo;
};

export type PackageInfo = {
  'dist-tags': DistTagsObject;
  versions: {
    [version: string]: VersionInfo;
  };
};
