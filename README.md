<p align="center">
  <img src="https://user-images.githubusercontent.com/193136/216785245-f79f6b05-eb58-491b-812e-a6e20df2a47f.png" alt="turbogha, Turborepo Remote Caching Server API implementation for GitHub Actions">
</p>

<p align="center">
  <a href="https://github.com/dtinth/setup-github-actions-caching-for-turbo/actions"><img alt="typescript-action status" src="https://github.com/dtinth/setup-github-actions-caching-for-turbo/workflows/build-test/badge.svg"></a>
</p>

The `dtinth/setup-github-actions-caching-for-turbo` action launches a [custom Turborepo Remote Caching Server](https://turbo.build/repo/docs/core-concepts/remote-caching#custom-remote-caches) that leverages [GitHub Actions’ Cache Service API](https://github.com/tonistiigi/go-actions-cache/blob/master/api.md) as a backing storage, and then configures Turborepo to use it.

## How to use

Add this to your GitHub Actions workflow, **before** running `turbo build`.

<!-- prettier-ignore -->
```yaml
      - uses: dtinth/setup-github-actions-caching-for-turbo@v1
```
