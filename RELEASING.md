# Releasing github-actionlint

## Prerequisites

1. **npm account**: Ensure you have an npm account and are a maintainer of the package.
2. **NPM_TOKEN**: Create an npm access token at https://www.npmjs.com/settings/~/tokens
   - Choose "Automation" or "Publish" scope
   - Add the token as a repository secret named `NPM_TOKEN` in GitHub

## Fully automated releases

The **Check upstream actionlint releases** workflow runs daily (and can be triggered manually). When a new [rhysd/actionlint](https://github.com/rhysd/actionlint) release is detected:

1. **Automatically** bumps `package.json` to match the new version
2. **Automatically** commits and pushes to `main`
3. **Automatically** creates and pushes tag `v{version}` (e.g. `v1.7.12`)
4. The tag push triggers the **Release** workflow, which:
   - Creates a GitHub release with mirrored notes from actionlint
   - Publishes to npm with provenance

No manual steps required. Ensure `main` is not protected with "Require pull request reviews" if you want the automated push to succeed, or configure a PAT with bypass permissions.

## Manual release (workflow_dispatch)

1. Go to **Actions** → **Release** → **Run workflow**
2. Enter the actionlint version to release (e.g. `1.7.11`)
3. The workflow will:
   - Update `package.json` version
   - Run tests
   - Create a GitHub release with mirrored upstream notes
   - Publish to npm with provenance

## GitHub Actions secrets

| Secret         | Required for     | Description                                            |
| -------------- | ---------------- | ------------------------------------------------------ |
| `NPM_TOKEN`    | Release workflow | npm token for publishing (Automation or Publish scope) |
| `GITHUB_TOKEN` | All workflows    | Automatically provided by GitHub Actions               |

## Local publish (for testing)

```bash
cd github-actionlint
npm ci
npm test
npm run test:parity  # Requires ACTIONLINT_TESTDATA=/path/to/actionlint
npm publish --dry-run  # Verify package contents
npm publish --access public  # Actual publish
```
