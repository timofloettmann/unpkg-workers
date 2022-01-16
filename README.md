# `unpkg-workers`

This project is a re-implementation of [unpkg.com](https://unpkg.com) ([Github](https://github.com/mjackson/unpkg)) using cloudflare workers.

**Notice:** This project is not trying to be a drop-in replacement for unpkg.com, many features are missing and most of those are not on the immediate To-Do list either.

## Motivation & Features

`unpkg.com` is a hosted service, therefore all packages are loaded from the official NPM registry and have to be publicly accessible. Packages published to a private registry needed another solution, which now supports the following features:

- [x] Custom registry support (jfrog.io, Basic Auth only)
- [x] Self hosting (on Cloudflare Workers)

## Usage

A minimal request would be for example `/main/react`.

`main` in this case says which field from the package.json to use to determine the actual entry file. The only other allowed value is `unpkg` (See [this issue](https://github.com/mjackson/unpkg/issues/63) to learn more about the `unpkg` field and why it might be useful)

With a short request such as the above, the version always falls back to `latest`, so `/main/react` is the same as `/main/react@latest`.

Any valid semver range is accepted, at time of writing `/main/react@^17.0` would resolve to `/main/react@17.0.2`.

Any request that does not contain a file path, will redirect with either a 302 or 301 status code, depending on the requested version. If the request was for a semver range or tag, the redirect will be a temporary one. Whereas requests for exact versions will end in a permanent redirect.

## Cache times

- All responses with status code 404 are cached for 1 minute
- All responses with status code 302 are cached for 5 minutes
- All 200 or 301 responses are cached for 1 year

## Developing and Deployment

This project is using the [Wrangler CLI](https://developers.cloudflare.com/workers/tooling/wrangler/commands) for development & deployment.

To use a custom registry, configure these secrets using wrangler:

```
wrangler secret put REGISTRY_URL
wrangler secret put REGISTRY_USERNAME
wrangler secret put REGISTRY_PASSWORD
```

**Be aware that you need to configure these secrets for each environment separately, for example with the `--env production` flag**

## Testing

- `npm run test`
- `npm run test:watch`
