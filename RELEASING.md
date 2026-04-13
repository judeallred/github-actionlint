# Releasing github-actionlint

## Prerequisites

1. **npm account**: Ensure you have an npm account and are a maintainer of the package.
2. **Trusted Publishers (OIDC)**: Configure on npmjs.com so publishes use short-lived credentials—no token to store or renew.

## Fully automated releases

The **Check upstream actionlint releases** workflow runs daily (and can be triggered manually). When a new [rhysd/actionlint](https://github.com/rhysd/actionlint) release is detected:

1. **Automatically** bumps `package.json` and `package-lock.json` to match the new version
2. **Automatically** commits and pushes to `main`
3. **Automatically** creates and pushes tag `v{version}` (e.g. `v1.7.12`)
4. **Automatically** triggers the **Release** workflow via `workflow_dispatch`, which:
   - Creates a GitHub release with mirrored notes from actionlint
   - Publishes to npm with provenance

> **Note**: The release workflow is triggered explicitly via `gh workflow run` rather than relying on the tag push event. This is because pushes made with `GITHUB_TOKEN` [do not trigger downstream workflows](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow), but `workflow_dispatch` events are exempt from this limitation.

No manual steps required. Ensure `main` is not protected with "Require pull request reviews" if you want the automated push to succeed, or configure a PAT with bypass permissions.

## Manual release (workflow_dispatch)

1. Go to **Actions** → **Release** → **Run workflow**
2. Enter the actionlint version to release (e.g. `1.7.11`)
3. The workflow will:
   - Update `package.json` version
   - Run tests
   - Create a GitHub release with mirrored upstream notes
   - Publish to npm with provenance

## Trusted Publishers setup (one-time)

The release workflow uses [npm Trusted Publishers (OIDC)](https://docs.npmjs.com/trusted-publishers)—no token to store or renew.

**First-time setup** (package must exist on npm before configuring):

1. Publish once manually: `npm login` then `npm publish --access public` from the repo root.
2. Go to [npmjs.com](https://www.npmjs.com/) → **Packages** → **github-actionlint** → **Settings** → **Trusted publishing**.
3. Click **GitHub Actions** and enter:
   - **Workflow filename**: `release.yaml`
   - **Repository**: `github-actionlint`
   - **Owner**: `judeallred`
4. Save. Future publishes from this workflow will use OIDC—no `NPM_TOKEN` needed.

## GitHub Actions secrets

| Secret         | Required for  | Description                      |
| -------------- | ------------- | -------------------------------- |
| `GITHUB_TOKEN` | All workflows | Automatically provided by GitHub |

## Local publish (for testing)

```bash
cd github-actionlint
npm ci
npm test
npm run test:parity  # Requires ACTIONLINT_TESTDATA=/path/to/actionlint
npm publish --dry-run  # Verify package contents
npm publish --access public  # Actual publish
```
