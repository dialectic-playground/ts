<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [ts](#ts)
  - [TypeScript at a glance](#typescript-at-a-glance)
  - [Toolchain](#toolchain)
  - [Layout](#layout)
  - [Development](#development)
  - [Implementing a project](#implementing-a-project)
  - [Contributing](#contributing)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/dialectic-playground/.github/main/assets/ts/dist/logo-dark.svg">
    <img alt="dialectic playground / ts" src="https://raw.githubusercontent.com/dialectic-playground/.github/main/assets/ts/dist/logo.svg" height="96">
  </picture>
</p>

# ts

TypeScript implementation of the Dialectic Playground SDLC curriculum.

📖 **Documentation:** <https://dialectic-playground.github.io/docs/reference/languages/ts/>

This repository implements the fifty-three projects of the
[SDLC curriculum](https://github.com/dialectic-playground/sdlc-curriculum) in TypeScript. Each project is
specified to the byte by the curriculum and verified by its black-box tests on Linux, macOS,
and Windows.

**Status:** Implemented projects: 00-hello-world.

## TypeScript at a glance

| Aspect                  | TypeScript                                                                |
| :---------------------- | :------------------------------------------------------------------------ |
| File extension          | `.ts`                                                                     |
| CLI classification      | Included                                                                  |
| Image category          | First-Class                                                               |
| Access to OS primitives | High (via V8 Node.js runtime wrappers)                                    |
| Entry-point mechanism   | Host binary consumes kernel flags first; residual args go to process.argv |

## Toolchain

|                      |                                                                            |
| :------------------- | :------------------------------------------------------------------------- |
| Release line         | Node.js 24 (LTS); TypeScript via tsc as a project dependency               |
| Build / package tool | npm + tsc                                                                  |
| Container image      | `node:24-trixie-slim`, pinned by digest ([`Containerfile`](Containerfile)) |
| Native CI            | actions/setup-node (24)                                                    |

`make toolchain` verifies that the container and native toolchains are on this release line.

Each project is an npm package (`"type": "module"`): `package.json` and the committed
`package-lock.json` live in the project directory and pin the development tools exactly, so
the container and the native CI use identical versions. `make` installs them with `npm ci`
into the project's `node_modules/` whenever the lockfile is newer than the installed tree.
Sources and unit tests live in `src/` (tests in `src/test/`); `tsc` compiles them to `dist/`.

| Purpose    | Tool                                                                                            | Make target   |
| :--------- | :---------------------------------------------------------------------------------------------- | :------------ |
| Build      | `tsc` (TypeScript 6.0, `"strict": true`)                                                        | `make all`    |
| Unit tests | `node:test`, run on the compiled output (`node --test`)                                         | `make test`   |
| Lint       | `tsc --noEmit`, ESLint (flat config, typescript-eslint strict type-checked), `prettier --check` | `make lint`   |
| Format     | Prettier                                                                                        | `make format` |

`BIN_DIR` is the project's `bin/`, which holds an extensionless `#!/usr/bin/env node`
launcher that loads `dist/main.js`. `make install` copies the compiled program to
`$(LIBDIR)/ts/<project>/` and writes a `#!/bin/sh` launcher to `$(BINDIR)`. Dependabot (npm)
keeps each project's lockfile current.

**Windows:** run the tools from Git Bash or MSYS2, which honor `#!` lines (or run
`node <project>/bin/<tool>` directly).

## Layout

| Path                                 | Contents                                                                                                          |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `00-hello-world/` … `52-spacecraft/` | One workspace per curriculum project: `Makefile` (with `DP_*` hooks), HLD, LLD, RTM, master test plan, and `src/` |
| `sdlc-curriculum/`                   | The curriculum, as a git submodule pinned to a release tag                                                        |
| `Makefile`                           | `make check` (repository, toolchain, implemented projects), `toolchain`, `projects`, `roundtrip`                  |
| `Containerfile`, `.devcontainer/`    | The toolchain image and the matching dev container                                                                |
| `tools/dp-run`, `tools/container.mk` | Shared container tooling (copies of the canonical files in `dialectic-playground/.github`)                        |
| `.github/workflows/ci.yml`           | CI: container and native (Linux, macOS, Windows) `make` targets, shared-tooling check, DCO                        |

## Development

Container-first: `make` targets and `tools/dp-run <command>` run in the toolchain container
via Podman, then Docker, then the local system. `DP_RUNTIME=podman|docker|local` overrides
the choice.

```sh
git clone --recurse-submodules https://github.com/dialectic-playground/ts.git
cd ts
make check                    # repository, toolchain, and every implemented project
DP_RUNTIME=local make check   # the same with your native toolchain
make -C 00-hello-world help   # a project's configuration and hooks
```

## Implementing a project

1. Complete the project's `hld.md` and `lld.md` before writing code.
2. Write the implementation and its unit tests under the project's `src/`, add the
   repository's npm + tsc configuration, and fill in `BIN_DIR` and the `DP_*` hooks in
   the project's `Makefile`.
3. Pass `make -C <project> test` (container) and `DP_RUNTIME=local make -C <project> test`.
4. Add the project directory to `IMPLEMENTED` in the root `Makefile`. CI then builds, lints,
   and tests it in the container and natively on all three operating systems.
5. Keep `rtm.md` and `master-test-plan.md` current.

Specifications: [curriculum reference](https://dialectic-playground.github.io/docs/reference/curriculum/). Language setup:
[Set up a language repository](https://dialectic-playground.github.io/docs/how-to/set-up-a-language-repository/).

## Contributing

See the [organization contributing guide](https://github.com/dialectic-playground/.github/blob/main/CONTRIBUTING.md).
Pull requests are squash-merged, titles follow Conventional Commits, and every commit needs a
DCO sign-off.

## License

[MIT](LICENSE)
