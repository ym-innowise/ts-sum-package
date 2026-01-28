# ts-sum-package

Trivial TypeScript package (`sum(a, b)`) used to demonstrate a fully automated CI/CD pipeline in GitHub Actions.

This repository contains the application code and minimal tooling (lint/build/test/e2e).  
All reusable CI logic is extracted to a separate repo and consumed as **reusable workflows**.

---

## Repositories (deliverables)

- **App repo (this repo):** `https://github.com/ym-innowise/ts-sum-package`
- **Reusable workflows repo:** `https://github.com/ym-innowise/workflows-library`

---------

## What this project provides

- `sum(a, b)` implementation in TypeScript.
- Unit tests (Vitest/Jest depending on setup).
- Trivial E2E/integration test (runs against built `dist/`).
- CI/CD pipeline implementing the required release process:
  - PR verification on every PR
  - label-driven workflows (`verify`, `publish`)
  - automated release on merge to `main` when `publish` label is present
  - Git tag + GitHub Release created automatically

---

## CI/CD overview (GitHub Actions)

### Pull Request verification (runs on every PR)

Workflow: `.github/workflows/pr-verify.yml` (calls reusable workflow)

Enforced via **branch protection** (configured automatically by separate workflow):
- **Up-to-date branch with `main`** (required checks set to *strict*)
- **Linear history** (no merge commits)
- **PR cannot be merged unless all checks pass**

Checks executed:
- **Linting** (`npm run lint`)
- **Build** (`npm run build`)
- **Unit tests** (`npm test`)
- **Dependencies locked**: `package-lock.json` required and install uses `npm ci`
- **Version bump required**: PR must change `package.json` version vs `main`

---

## Label-driven workflows

### `verify` label → E2E / integration tests

When a PR has the label **`verify`**, an additional workflow runs:
- Builds the package
- Runs E2E/integration checks (`npm run e2e`)

This is intentionally simple but proves the label-driven gate.

---

### `publish` label → Release candidate (pre-merge)

When a PR has the label **`publish`**, a release-candidate workflow runs and must succeed before merge:

It does the following:
1. Runs the same quality gates (lint/build/unit tests).
2. **Blocks release if version already exists**:
   - Checks whether Git tag `vX.Y.Z` already exists in the remote repository.
3. Creates a **pre-merge version suffix** (without committing):
   - `X.Y.Z-dev-<short-sha>`
4. Produces a **publishable artifact** (tarball via `npm pack`) and uploads it as a workflow artifact.

> Pre-merge builds never publish or tag anything; they only produce artifacts and prove the release is possible.

---

## Release on merge (only for PRs with `publish` label)

When a PR with label **`publish`** is merged into `main`:

1. The workflow rebuilds from `main` (lint/build/test).
2. Validates again that `vX.Y.Z` does not already exist.
3. Creates Git tag: **`vX.Y.Z`**
4. Creates a **GitHub Release** named **`vX.Y.Z`**
5. Attaches the build artifact (`npm pack` tarball) to the GitHub Release.

✅ After PR approval, there are **no manual steps**.

---

## Versioning rules

- **Semantic versioning** is required: `X.Y.Z`
- The version must be **explicitly bumped in the PR** (`package.json` version must differ from `main`)
- Pre-merge `publish` builds generate a temporary suffix:
  - `X.Y.Z-${VAR}-<short-sha>` (not committed)

---

## Branch protection automation

Branch protection is configured automatically via workflow:

- `.github/workflows/setup-branch-protection.yml`

It enforces:
- required PR checks
- strict “up-to-date with main”
- linear history
- review requirement (at least 1 approval)

Run it once via `workflow_dispatch` when the repo is created.

---

## Local development & validation

Install dependencies:
```bash
npm ci