# Test Fixtures

Representative input files used by integration tests and as documentation examples.
Each subdirectory covers one metadata format.

## `codemeta/`

| File                | Shape           | Notes                                                                                                                                                                                      |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimal.json`      | Minimal         | Only `@context`, `@type`, `name`, `description` — no optional fields                                                                                                                       |
| `project.json`      | Fully-populated | Mirrors the project's own `codemeta.json`; uses a non-SPDX GitHub blob license URL, so the license name becomes `"Other"` after conversion                                                 |
| `spdx-license.json` | Edge case       | Valid `https://spdx.org/licenses/MIT` URL; Person author with `givenName`/`familyName`; multi-language `programmingLanguage` array; plain `dateCreated`/`dateModified` (no time component) |

## `codejson/`

| File                   | Shape           | Notes                                                                                                                                                                                                                                                                                                     |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project.json`         | Fully-populated | Mirrors the project's own `code.json`; single language, single non-SPDX license                                                                                                                                                                                                                           |
| `roundtrip-input.json` | Edge case       | Used in round-trip tests; all required schema fields present; contains code.json-only fields set to non-default values (`organization`, `repositoryVisibility`, `laborHours`, `reuseFrequency`, `maintenance`, `contractNumber`, `AIUseCaseID`) to verify they revert to defaults after a full round-trip |
