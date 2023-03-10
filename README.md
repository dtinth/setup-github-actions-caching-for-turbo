<p align="center">
  <img src="https://user-images.githubusercontent.com/193136/216785245-f79f6b05-eb58-491b-812e-a6e20df2a47f.png" alt="turbogha, Turborepo Remote Caching Server API implementation for GitHub Actions">
</p>

<p align="center">
  <a href="https://github.com/dtinth/setup-github-actions-caching-for-turbo/actions"><img alt="typescript-action status" src="https://github.com/dtinth/setup-github-actions-caching-for-turbo/workflows/build-test/badge.svg"></a>
</p>

The `dtinth/setup-github-actions-caching-for-turbo` action launches a [custom Turborepo Remote Caching Server](https://turbo.build/repo/docs/core-concepts/remote-caching#custom-remote-caches) (codenamed “turbogha”) that leverages [GitHub Actions’ Cache Service API](https://github.com/tonistiigi/go-actions-cache/blob/master/api.md) as a backing storage, and then configures Turborepo to use it.

## How to use

Add this to your GitHub Actions workflow, **before** running `turbo build`.

<!-- prettier-ignore -->
```yaml
      - uses: dtinth/setup-github-actions-caching-for-turbo@v1
```

The action will:

1. Launch a server on `localhost:41230` (and waits for it to be ready).

2. Exports the `TURBO_API`, `TURBO_TOKEN` and `TURBO_TEAM` environment variables for use by `turbo build`.

3. Sets up a post-build step to print the server logs (for debugging).

## Configuration

Configuration is optional. Here are the available options and their default values:

<!-- prettier-ignore -->
```yaml
        with:
          # Set the prefix for the cache keys.
          cache-prefix: turbogha_
```

## Disclaimer

This project is experimental and is provided as-is. It relies on [GitHub Actions Cache Service API](https://github.com/tonistiigi/go-actions-cache/blob/master/api.md), for which there is no official documentation (however [it’s been used by Docker Build as a cache backend for a long time](https://docs.docker.com/build/cache/backends/gha/)). It is only tested to work with GitHub Actions’ hosted runners running on Linux. Please do not expect that it will be stable or work in all cases. Feel free to open an issue if you have any questions or problems, but I have no plans to provide support beyond my own use cases. If you need this action to work in your use case, you are welcome to fork this project and make changes to suit your needs in accordance with the [MIT License](LICENSE).
