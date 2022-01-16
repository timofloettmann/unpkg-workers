declare let global: any;

export function makeFakeCache(): { caches: CacheStorage } {
  class FakeCacheImpl {
    put = (): Promise<undefined> => Promise.resolve(undefined);
    match = (): Promise<Response | undefined> => Promise.resolve(undefined);
    delete = (): Promise<boolean> => Promise.resolve(true);
  }

  return {
    caches: {
      open: () => Promise.resolve(new FakeCacheImpl()),
      default: new FakeCacheImpl(),
    },
  };
}

global.beforeEach(() => {
  Object.assign(
    global,
    {
      fetch: require('isomorphic-fetch'),
      crypto: require('crypto'),
    },
    makeFakeCache(),
  );

  jest.resetModules();
});

global.btoa = function (str: string) {
  return Buffer.from(str, 'binary').toString('base64');
};

global.atob = function (b64Encoded: string) {
  return Buffer.from(b64Encoded, 'base64').toString('binary');
};
