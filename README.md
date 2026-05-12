# codejson-crosswalk

A TypeScript npm package for bidirectional conversion between code.json and other metadata formats

## About the Project

There is no automated bridge between code.json and other software metadata formats. This package provides a single function call to convert between code.json and other formats, with code.json at the center of a hub-and-spoke architecture.

### Project Vision

A world where government open source software metadata is interoperable across standards, where a single source of truth in code.json can seamlessly power any downstream metadata consumer, and where federal agencies can meet open source compliance requirements without duplicating manual effort.

### Project Mission

To provide a reliable, well-tested, and extensible conversion library that bridges code.json with other software metadata formats, reducing the friction of open source compliance for CMS and the broader federal open source community.

### Agency Mission

The Centers for Medicare & Medicaid Services (CMS) is committed to building and maintaining high-quality, open, and reusable software. CMS's Open Source Program Office (OSPO) promotes transparency, collaboration, and code reuse across the agency and the federal government in accordance with the [CMS Open Source Policy](https://github.com/CMSGov/cms-open-source-policy).

### Team Mission

The DSACMS team builds open source tooling and infrastructure that makes it easier for CMS engineering teams to meet federal open source obligations. The codejson-crosswalk project is part of that effort — reducing manual work, preventing metadata drift, and enabling interoperability across the federal open source ecosystem.

## Core Team

A list of core team members responsible for the code and documentation in this repository can be found in [COMMUNITY.md](COMMUNITY.md). 

## Repository Structure

```plaintext
.
├── src/
│   ├── helpers/
│   │   ├── convert.ts                # Generic conversion engine
│   │   ├── handle-nested-values.ts   # Utilities for reading/writing nested object paths
│   │   └── README.md                 # Documentation for the engine and helpers
│   ├── metadata/
│   │   └── codemeta/
│   │       ├── codejson-to-codemeta.ts  # code.json → codemeta mapping definitions
│   │       ├── codemeta-to-codejson.ts  # codemeta → code.json mapping definitions
│   │       ├── handler.ts               # Coordinator functions for codemeta conversions
│   │       └── README.md                # Documentation for mapping files
│   ├── types/
│   │   └── MappingEntry.ts           # Shared MappingEntry type definition
│   ├── cli.ts                        # CLI entry point
│   ├── cli-helpers.ts                # CLI argument parsing and I/O helpers
│   └── index.ts                      # Package entry point and public API
├── src/tests/
│   ├── convert.test.ts               # Unit tests for the conversion engine
│   └── handle-nested-values.test.ts  # Unit tests for nested value helpers
├── .github/                          # GitHub Actions workflows
├── COMMUNITY.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── README.md
```

# Development and Software Delivery Lifecycle

The following guide is for members of the project team who have access to the repository as well as code contributors. The main difference between internal and external contributions is that external contributors will need to fork the project and will not be able to merge their own pull requests. For more information on contributing, see: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Local Development

This project uses [Bun](https://bun.sh/) as its runtime and package manager.

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run tests
bun test

# Run the CLI locally
bun run src/cli.ts code.json --to codemeta

# Build the package
bun build src/index.ts --outdir dist
```

**Stdin/stdout usage:**

```bash
# Convert code.json → codemeta.json
bun run src/cli.ts code.json --to codemeta --out codemeta.json

# Pipe from stdin
cat code.json | bun run src/cli.ts --to codemeta > codemeta.json

# Convert codemeta.json → code.json
bun run src/cli.ts codemeta.json --to codejson
```

## Coding Style and Linters

This project uses TypeScript with strict type checking. All code must pass the TypeScript compiler before being committed.

```bash
# Type-check the project
bun tsc --noEmit

# Run all tests
bun test
```

Style conventions:
- TypeScript strict mode is enabled
- All public functions must have JSDoc comments
- Transform functions accept `unknown` and return typed values — never bypass the type guard pattern
- No `any` types

Lint and type checks are run on each commit via GitHub Actions; run them locally before pushing.

## Branching Model

This project follows [trunk-based development](https://trunkbaseddevelopment.com/), which means:

* Make small changes in [short-lived feature branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/) and merge to `main` frequently.
* Be open to submitting multiple small pull requests for a single ticket (i.e. reference the same ticket across multiple pull requests).
* Treat each change you merge to `main` as immediately deployable to production. Do not merge changes that depend on subsequent changes you plan to make, even if you plan to make those changes shortly.
* Ticket any unfinished or partially finished work.
* Tests should be written for changes introduced, and adhere to the coverage threshold determined by the project.

This project uses **continuous deployment** using [Github Actions](https://github.com/features/actions) which is configured in the [.github/workflows](.github/workflows) directory.

Pull-requests are merged to `main` and the changes are immediately deployed to the development environment. Releases are created to push changes to production.

## Contributing

Thank you for considering contributing to an Open Source project of the US Government! For more information about our contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Community

The codejson-crosswalk team is taking a community-first and open source approach to the product development of this tool. We believe government software should be made in the open and be built and licensed such that anyone can download the code, run it themselves without paying money to third parties or using proprietary software, and use it as they will.

We know that we can learn from a wide variety of communities, including those who will use or will be impacted by the tool, who are experts in technology, or who have experience with similar technologies deployed in other spaces. We are dedicated to creating forums for continuous conversation and feedback to help shape the design and development of the tool.

We also recognize capacity building as a key part of involving a diverse open source community. We are doing our best to use accessible language, provide technical and process documents, and offer support to community members with a wide variety of backgrounds and skillsets.

### Community Guidelines

Principles and guidelines for participating in our open source community can be found in [COMMUNITY.md](COMMUNITY.md). Please read them before joining or starting a conversation in this repo or one of the channels listed below. All community members and participants are expected to adhere to the community guidelines and code of conduct when participating in community spaces including: code repositories, communication channels and venues, and events.

## Feedback

If you have ideas for how we can improve or add to our capacity building efforts and methods for welcoming people into our community, please let us know at opensource@cms.hhs.gov. If you would like to comment on the tool itself, please let us know by filing an **issue on our GitHub repository.**

## Policies

### Open Source Policy

We adhere to the [CMS Open Source
Policy](https://github.com/CMSGov/cms-open-source-policy). If you have any
questions, just [shoot us an email](mailto:opensource@cms.hhs.gov).

### Security and Responsible Disclosure Policy

_Submit a vulnerability:_ Vulnerability reports can be submitted through [Bugcrowd](https://bugcrowd.com/cms-vdp). Reports may be submitted anonymously. If you share contact information, we will acknowledge receipt of your report within 3 business days.

For more information about our Security, Vulnerability, and Responsible Disclosure Policies, see [SECURITY.md](SECURITY.md).

### Software Bill of Materials (SBOM)

A Software Bill of Materials (SBOM) is a formal record containing the details and supply chain relationships of various components used in building software.

In the spirit of [Executive Order 14028 - Improving the Nation's Cyber Security](https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/information-technology-category/it-security/executive-order-14028), a SBOM for this repository is provided here: https://github.com/DSACMS/codejson-crosswalk/network/dependencies.

For more information and resources about SBOMs, visit: https://www.cisa.gov/sbom.

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/) as indicated in [LICENSE](LICENSE).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.
