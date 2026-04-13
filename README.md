# github-actionlint

[![npm](https://img.shields.io/npm/v/github-actionlint)](https://www.npmjs.com/package/github-actionlint)

Run [actionlint](https://github.com/rhysd/actionlint)—the linter for GitHub Actions workflows—from your Node.js project. No separate install step for a binary: add a dev dependency, wire a script, and catch workflow mistakes before they land on `main`.

---

## Why this exists

GitHub Actions YAML looks simple until it isn’t: expression contexts, reusable workflows, `secrets` vs `env`, shell injection in `run:` blocks, and copy-pasted paths that only break in CI. [actionlint](https://github.com/rhysd/actionlint) was built to lint those workflows the way ESLint lints JavaScript.

**Motivation for this package:** many teams already standardize on **npm** for developer tooling. Installing actionlint through npm means:

- **One toolchain**—`npm install` / `pnpm add` / `yarn add` alongside your other devDependencies.
- **No manual binary management** on each machine or CI image; the first run downloads the official release for your OS/arch and caches it under `~/.github-actionlint`.
- **Pinning**—lock the linter version in `package-lock.json` (or equivalent) so everyone runs the same rules.

Use it locally before you push, in **pre-commit** hooks, and in **CI** so broken workflows fail fast.

---

## Credits & upstream documentation

**github-actionlint** is not a reimplementation: it downloads and runs the official **actionlint** binary from [rhysd/actionlint](https://github.com/rhysd/actionlint). All workflow checks, flags, and behavior come from that project.

For authoritative details—every CLI flag, [configuration](https://github.com/rhysd/actionlint/blob/main/docs/config.md), ignore rules, and editor integrations—use the upstream docs, especially:

- **[Usage](https://github.com/rhysd/actionlint/blob/main/docs/usage.md)** — command-line options (including `-shellcheck` / `-pyflakes`)
- **[Checks](https://github.com/rhysd/actionlint/blob/main/docs/checks.md)** — what actionlint validates and how optional tools integrate

---

## Optional integrations: shellcheck and pyflakes

actionlint can delegate to external linters for scripts inside `run:` steps. Per the [shellcheck integration](https://github.com/rhysd/actionlint/blob/main/docs/checks.md#check-shellcheck-integ) and [pyflakes integration](https://github.com/rhysd/actionlint/blob/main/docs/checks.md#check-pyflakes-integ) sections of the upstream **checks** documentation:

- **By default**, actionlint looks for `shellcheck` and `pyflakes` on your **`PATH`** and uses each one **only if it is found**. If `pyflakes` (or `shellcheck`) is not installed or not on your path, **that integration is skipped**—actionlint still runs; you simply do not get those extra `run:`-script checks from the missing tool.
- **GitHub Actions:** [shellcheck](https://github.com/koalaman/shellcheck) is **pre-installed on GitHub-hosted runners** (e.g. `ubuntu-latest`, `macos-latest`, `windows-latest`), so shellcheck-backed checks for `run:` scripts work in CI without extra setup—see the [runner image software lists](https://github.com/actions/runner-images). **pyflakes** is not included by default; install it in the job (e.g. `pip install pyflakes`) if you want those checks in Actions.
- To point at a specific executable, use `-shellcheck=/path/to/shellcheck` or `-pyflakes=/path/to/pyflakes`.
- To turn an integration off explicitly (and avoid spawning those processes), use `-shellcheck=` or `-pyflakes=` with an **empty** value—see [Ignore some errors](https://github.com/rhysd/actionlint/blob/main/docs/usage.md#ignore-some-errors) in the upstream usage guide.

On a **local** machine you may need to install [shellcheck](https://github.com/koalaman/shellcheck) and/or [pyflakes](https://github.com/PyCQA/pyflakes) (e.g. `pip install pyflakes`) if they are not already on your `PATH`.

---

## Install

```bash
npm install --save-dev github-actionlint
```

---

## Use it in practice

### Add a script to `package.json`

Most projects add a dedicated script so “check my workflows” is one command:

```json
{
  "scripts": {
    "check:actions": "github-actionlint .github/workflows/"
  }
}
```

Then:

```bash
npm run check:actions
```

You can combine it with other checks:

```json
{
  "scripts": {
    "check": "npm run check:actions && npm run lint && npm run test",
    "check:actions": "github-actionlint .github/workflows/"
  }
}
```

### CLI examples

```bash
# Default: lint workflow files under .github/workflows/
npx github-actionlint .github/workflows/

# More detail
npx github-actionlint -color -verbose .github/workflows/

# Match what you run in CI (paths depend on your repo layout)
npx github-actionlint .github/workflows/*.yaml
```

### Programmatic API

```js
const { actionlint } = require("github-actionlint");

const result = await actionlint({
  args: [".github/workflows/", "-color"],
});
console.log(result.stdout.toString());
console.log(result.stderr.toString());
process.exit(result.code);
```

---

## Environment variables

| Variable               | Description                                   |
| ---------------------- | --------------------------------------------- |
| `ACTIONLINT_BIN`       | Path to actionlint binary (skip download)     |
| `ACTIONLINT_RELEASE`   | actionlint version (default: package version) |
| `ACTIONLINT_CACHE_DIR` | Cache directory for downloaded binary         |
| `GITHUB_TOKEN`         | GitHub token for API rate limits (optional)   |

---

## Supported platforms

- **macOS**: x64, arm64
- **Linux**: x64, arm64, 386, arm
- **Windows**: x64, arm64
- **FreeBSD**: 386, amd64

---

## Versioning

This package **tracks [rhysd/actionlint](https://github.com/rhysd/actionlint) releases**: the npm version matches the actionlint version it bundles. When upstream ships a new release, **github-actionlint** publishes a matching version so you stay aligned with the official linter.

---

## Releasing & maintenance

Maintainers: see [RELEASING.md](./RELEASING.md) for automated upstream sync, GitHub Releases, and npm publishing (including Trusted Publishers / OIDC).

## License

MIT
