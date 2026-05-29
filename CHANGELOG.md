# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Starting with the next release, this file is automatically
> regenerated on each GitHub Release by the
> [auto-changelog workflow](.github/workflows/auto-changelog.yml).
> Contributors should still add entries under `[Unreleased]` in their PRs;
> the workflow will promote them into the versioned section at release time.

---

## [Unreleased]

<!-- Add your changes here before a release is cut. -->

---

## [0.1.0] - 2026-05-29

### Added

- Bidirectional conversion engine between `code.json` and `codemeta.json` via a
  hub-and-spoke mapping architecture (`src/metadata/codemeta/`).
- Public TypeScript API: `convert()` function with typed `MappingEntry` interface
  exported from `src/index.ts`.
- CLI (`codejson-crosswalk`) supporting file-path arguments, `--to` format flag,
  and stdin piping.
- Unit tests for the conversion engine and nested path helpers
  (`src/tests/convert.test.ts`, `src/tests/handle-nested-values.test.ts`).
- Integration-level fixtures for codemeta round-trip testing.
- TypeDoc documentation generation (`bun run docs`).
- ESLint and Prettier configuration with accompanying CI checks.
- Code coverage reporting via `bun test --coverage`.
- Example scripts in `examples/` demonstrating common conversion workflows.
- GitHub Actions CI for lint, format, type-check, and test on each push/PR.
- Auto-changelog workflow that regenerates `CHANGELOG.md` on each GitHub Release.

[Unreleased]: https://github.com/DSACMS/codejson-crosswalk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/DSACMS/codejson-crosswalk/releases/tag/v0.1.0
