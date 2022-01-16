import semver from 'semver';

export type DistTagsObject = { latest: string } & { [tag: string]: string };

export const resolveSemverVersion = (
  versions: Array<string>,
  tags: DistTagsObject,
  range: string,
): string | null => {
  if (range in tags) {
    return tags[range];
  }

  if (versions.includes(range)) {
    return range;
  }

  const maxSatisfying = semver.maxSatisfying(
    versions.sort(semver.rcompare),
    range,
    { loose: true },
  );
  if (maxSatisfying) {
    return maxSatisfying;
  }

  return null;
};
