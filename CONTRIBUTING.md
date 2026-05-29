# How to Contribute

We're so thankful you're considering contributing to an [open source project of
the U.S. government](https://code.gov/)! If you're unsure about anything, just
ask — or submit the issue or pull request anyway. The worst that can happen is
you'll be politely asked to change something. We appreciate all friendly
contributions.

We encourage you to read this project's CONTRIBUTING policy (you are here), its
[LICENSE](LICENSE.md), and its [README](README.md).

## Getting Started

Good first issues are labeled [`good first issue`](https://github.com/DSACMS/codejson-crosswalk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) in the issue tracker. These are scoped to be self-contained and approachable without deep familiarity with the full codebase.

### Team Specific Guidelines

See [COMMUNITY.md](COMMUNITY.md) for the current list of maintainers, approvers, and reviewers. External contributors follow the fork-and-PR workflow described below; internal contributors with write access work directly in this repository.

### Building Dependencies

This project requires [Bun](https://bun.sh/) (v1.0 or later) as its runtime and package manager. Bun replaces both Node.js and npm for this project.

**Install Bun:**

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (via npm, as a fallback)
npm install -g bun
```

Verify your installation:

```bash
bun --version
```

No other runtime dependencies are required. All TypeScript compilation and test running is handled by Bun.

### Building the Project

```bash
# Clone the repository
git clone https://github.com/DSACMS/codejson-crosswalk.git
cd codejson-crosswalk

# Install dependencies
bun install

# Type-check without emitting output
bun tsc --noEmit

# Build the distributable package
bun build src/index.ts --outdir dist --target node

# Run the CLI locally (no build step required)
bun run src/cli.ts --help
```

To verify everything is working end-to-end:

```bash
# Convert a code.json to codemeta.json
bun run src/cli.ts code.json --to codemeta

# Convert a codemeta.json to code.json
bun run src/cli.ts codemeta.json --to codejson

# Pipe from stdin
cat code.json | bun run src/cli.ts --to codemeta > codemeta.json
```

### Workflow and Branching

We follow [trunk-based development](https://trunkbaseddevelopment.com/) using the [GitHub Flow](https://guides.github.com/introduction/flow/) model.

**For external contributors (fork workflow):**

1. Fork the repository on GitHub
2. Check out the `main` branch of your fork
3. Create a short-lived feature branch: `git checkout -b feat/my-change`
4. Write code and tests for your change
5. Run tests locally: `bun test`
6. Run the type checker: `bun tsc --noEmit`
7. Open a pull request against `DSACMS/codejson-crosswalk/main`
8. Work with maintainers through review
9. After merge, delete your feature branch

**For internal contributors:**

Follow the same branch-and-PR workflow directly in this repository (no fork needed). Do not push directly to `main`.

**Branch naming conventions:**

| Prefix | Use |
|---|---|
| `feat/` | New features or spoke formats |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `test/` | Test additions or improvements |
| `chore/` | Dependency bumps, tooling, CI |

### Testing Conventions

Tests live in `src/tests/` and are run with Bun's built-in test runner.

```bash
# Run all tests
bun test

# Run a specific test file
bun test src/tests/convert.test.ts

# Run tests in watch mode
bun test --watch
```

The test suite is organized into three files:
- `convert.test.ts` — unit tests for the generic conversion engine
- `handle-nested-values.test.ts` — unit tests for the nested path read/write helpers
- Integration-level tests for the codemeta mapping live inline in the mapping files' corresponding test files

All PRs must maintain or improve test coverage. New mapping entries and transform functions require accompanying test cases.

### Coding Style and Linters

This project uses TypeScript in strict mode. Style conventions are enforced by the TypeScript compiler.

**Rules to follow:**

1. **No `any` types.** Use `unknown` for values whose type is not yet known, and narrow with type guards.
2. **Transform functions accept `unknown` and return typed values.** Never assume the input type without checking it.
3. **JSDoc comments on all exported functions and types.** One-line summary plus `@param` / `@returns` for non-trivial signatures.
4. **Keep mapping files declarative.** Logic belongs in named transform functions, not inline arrow functions longer than one expression.
5. **Named functions for non-trivial transforms.** If a transform has branching or helper calls, extract it as a named function above the mapping array.

**Linting and formatting:**

```bash
# Check for lint errors
bun run lint

# Format source files
bun run format

# Check formatting without writing (used in CI)
bun run format:check
```

**Type checking:**

```bash
bun tsc --noEmit
```

All three checks (lint, format, type-check) run in CI and must pass before a PR can be merged.

### Writing Issues

When filing a bug report or feature request, use the appropriate issue template from `.github/ISSUE_TEMPLATE/`. If no template fits, follow this format:

```
module-name: One line summary of the issue (less than 72 characters)

### Expected behavior

As concisely as possible, describe the expected behavior.

### Actual behavior

As concisely as possible, describe the observed behavior.

### Steps to reproduce the behavior

List all relevant steps to reproduce the observed behavior.
Include the input JSON and the command used (or the programmatic call).

### Environment

- Bun version: (bun --version)
- OS: (macOS / Linux / Windows)
- Package version: (from package.json)
```

**For new spoke formats** (e.g. adding `citation.cff` support), open a feature issue with:
- A link to the target format's schema or specification
- A proposed field mapping table covering 1:1 renames, transforms needed, and fields with no equivalent in either direction
- Any known lossy conversions and how you propose to handle them

### Writing Pull Requests

Pull request descriptions should follow the template in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

Key conventions:

- Keep the line width of commit messages to 72 characters or fewer in the subject line
- Use the active voice and present tense in the subject line: "Add citation.cff spoke" not "Added citation.cff spoke"
- Prefix the subject with its scope: `codemeta:`, `engine:`, `cli:`, `docs:`, `test:`, `chore:`
- One logical change per PR; reference the same ticket across multiple PRs if needed
- Tests must pass (`bun test`) and type checking must succeed (`bun tsc --noEmit`) before requesting review

### Updating the Changelog

Every PR that introduces a user-visible change **must** add an entry to [CHANGELOG.md](CHANGELOG.md) under the `[Unreleased]` section. Use one of the standard Keep a Changelog subsections:

| Subsection | When to use |
|---|---|
| `Added` | New features, new spoke formats, new CLI flags |
| `Changed` | Changes to existing behavior or mapping logic |
| `Deprecated` | Features that will be removed in a future release |
| `Removed` | Features removed in this release |
| `Fixed` | Bug fixes |
| `Security` | Fixes for security vulnerabilities |

Write entries as short, active-voice bullet points from the perspective of a user of the library or CLI — not as internal implementation notes.

**You do not need to pick a version number.** The [auto-changelog workflow](.github/workflows/auto-changelog.yml) regenerates `CHANGELOG.md` automatically whenever a GitHub Release is created, promoting `[Unreleased]` entries into the versioned section. If your PR contains only internal changes (CI config, test infrastructure, tooling) that have no impact on library consumers, a changelog entry is optional.

## Reviewing Pull Requests

Pull requests are reviewed by maintainers and approvers listed in [COMMUNITY.md](COMMUNITY.md). The review process checks for:

- Correctness of the mapping logic and transform functions
- Adequate test coverage for new entries and transforms
- Documentation of any lossy conversions in both the mapping file and the relevant `README.md`
- TypeScript strict compliance (no `any`, proper type narrowing)
- Consistency with the existing hub-and-spoke architecture

PRs are merged by a maintainer or approver after at least one approving review. External contributor PRs require one approving review from a maintainer.

## Shipping Releases

`codejson-crosswalk` uses [Semantic Versioning](https://semver.org/). Releases are cut ad-hoc when a meaningful set of changes has accumulated or when a bug fix is needed.

- **MAJOR** — breaking changes to the public API (exported function signatures, `MappingEntry` type shape)
- **MINOR** — new spoke formats, new mapping entries, non-breaking additions
- **PATCH** — bug fixes, transform corrections, documentation updates

Releases are published to npm via GitHub Actions on merge to `main` when a version tag is pushed.

## Documentation

We welcome improvements to documentation. For changes to mapping behavior, update both the inline code comments and the relevant `README.md` in the affected module directory (`src/helpers/README.md` for engine changes, `src/metadata/codemeta/README.md` for codemeta mapping changes).

File an [issue](https://github.com/DSACMS/codejson-crosswalk/issues) if you find documentation that is out of date, ambiguous, or missing.

## Policies

### Open Source Policy

We adhere to the [CMS Open Source
Policy](https://github.com/CMSGov/cms-open-source-policy). If you have any
questions, just [shoot us an email](mailto:opensource@cms.hhs.gov).

### Security and Responsible Disclosure Policy

_Submit a vulnerability:_ Vulnerability reports can be submitted through [Bugcrowd](https://bugcrowd.com/cms-vdp). Reports may be submitted anonymously. If you share contact information, we will acknowledge receipt of your report within 3 business days.

For more information about our Security, Vulnerability, and Responsible Disclosure Policies, see [SECURITY.md](SECURITY.md).

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.