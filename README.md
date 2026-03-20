# github-actionlint

Run [rhysd/actionlint](https://github.com/rhysd/actionlint) from Node.js. Downloads the official binary from GitHub Releases on first use.

## Installation

```bash
npm install --save-dev github-actionlint
```

## Usage

### CLI

```bash
npx github-actionlint
npx github-actionlint .github/workflows/
npx github-actionlint -color -verbose
```

### Programmatic

```js
const { actionlint } = require("github-actionlint");

const result = await actionlint({
  args: [".github/workflows/", "-color"],
});
console.log(result.stdout.toString());
console.log(result.stderr.toString());
process.exit(result.code);
```

### npm scripts

```json
{
  "scripts": {
    "lint:workflows": "github-actionlint .github/workflows/"
  }
}
```

## Environment variables

| Variable               | Description                                   |
| ---------------------- | --------------------------------------------- |
| `ACTIONLINT_BIN`       | Path to actionlint binary (skip download)     |
| `ACTIONLINT_RELEASE`   | actionlint version (default: package version) |
| `ACTIONLINT_CACHE_DIR` | Cache directory for downloaded binary         |
| `GITHUB_TOKEN`         | GitHub token for rate limit (optional)        |

## Supported platforms

- **macOS**: x64, arm64
- **Linux**: x64, arm64, 386, arm
- **Windows**: x64, arm64
- **FreeBSD**: 386, amd64

## Versioning

This package mirrors [rhysd/actionlint](https://github.com/rhysd/actionlint) versions. When a new actionlint release is published, the github-actionlint maintainers publish a matching release.

## Releasing

See [RELEASING.md](./RELEASING.md) for publishing to npm and CI setup (NPM_TOKEN, etc.).

## License

MIT
