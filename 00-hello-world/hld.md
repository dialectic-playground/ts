# High-Level Design (HLD) — Standard Terminal Hello World

| Field | Value |
| :-- | :-- |
| Project | `00-hello-world` |
| Tools | dp-hello |
| Implementation language | TypeScript 6.0 on Node.js 24 (ES modules, compiled by `tsc`) |
| Author | Brandon Perkins (with Claude Code) |
| Version / date | 1.0 — 2026-10-13 |
| Status | Approved |
| Inputs | `specs/URD.md`, `specs/SRS.md`, `specs/user-manual.md`, `shared/CLI-CONVENTIONS.md` |

## 1. Introduction

### 1.1 Scope
`dp-hello` writes the greeting `Hello, NAME!` (NAME defaults to `World`) COUNT times (1–1000,
default 1) to standard output, and supports `--help` and `--version` (SRS §1.2, §2.2). It
reads no input, takes no operands, and touches no files or environment variables. Usage
errors produce the exact CLI-CONV diagnostics with exit status 2.

### 1.2 Definitions and acronyms
| Term | Meaning |
| :-- | :-- |
| Outcome | The pure result of one invocation: stdout text, stderr text, exit status |
| Parse result | The syntactic reading of argv: greet request, help, version, or usage error |
| Launcher | `bin/dp-hello`, the `#!/usr/bin/env node` script that loads `dist/main.js` |
| LF | The byte `0x0A`, the only line terminator the tool writes |

### 1.3 References
- SRS §3 (interfaces), §4 (FR-01 … FR-11), §5 (NFR-01 … NFR-07), §6 (diagnostics).
- CLI-CONV §2 (CONV-03, CONV-05), §3 (CONV-07 … CONV-12), §4 (CONV-13 … CONV-15), §8.

## 2. Requirements summary

| Area | SRS requirements | Architectural impact |
| :-- | :-- | :-- |
| Option parsing | FR-02, FR-06, FR-07, FR-08, FR-10, CONV-07 … CONV-12 | A hand-written, total parser (`options.ts`) that stops at `--help`/`--version` |
| Validation | FR-03, FR-04, FR-05, FR-09 | A separate unit (`validation.ts`) that checks the winning values |
| Greeting | FR-01, FR-02, FR-04, NFR-05 | Pure functions (`greeting.ts`) |
| Diagnostics, exit status | FR-11, §3.7, §6, CONV-13 … CONV-15 | One place (`cli.ts::usageError`) formats every usage error |
| Byte-exact output | NFR-01, CONV-03, CONV-05, CONV-25 | One output unit (`output.ts`) writes UTF-8 buffers |
| Build/install | NFR-06, UR-12 | npm + tsc, Makefile hooks, a launcher in `BIN_DIR` |

## 3. Architectural overview

### 3.1 Context diagram

```text
                    ┌──────────────────────────────┐
  argv (UTF-8 / ──▶ │ dp-hello (node dist/main.js) │ ──▶ stdout (greeting, help, version)
  UTF-16 → UTF-8)   │                              │ ──▶ stderr (usage diagnostics)
                    └──────────────────────────────┘ ──▶ exit status 0 / 2
  No stdin, files, environment variables, subprocesses, or network.
```

### 3.2 Component (module) decomposition

| Component | Responsibility | Depends on |
| :-- | :-- | :-- |
| `options.ts` (parsing) | Turn argv tokens into a parse result or the first syntactic usage error | — |
| `validation.ts` (validation) | Turn a greet request into a `Config` (name, count) or a usage error | `options.ts` (types) |
| `greeting.ts` (greeting) | Build the greeting text (pure) | — |
| `cli.ts` (core) | `run(args) → Outcome`: compose the above; help/version text; diagnostic format | the three above |
| `output.ts` (output) | Write an Outcome to the streams as UTF-8 bytes; set the exit status | `cli.ts` (types) |
| `main.ts` (entry) | `emit(run(process.argv.slice(2)), process)` | `cli.ts`, `output.ts` |
| `bin/dp-hello` (launcher) | `#!/usr/bin/env node` script importing `dist/main.js` | `main.ts` |

### 3.3 Data flow
argv → `parseArgs` → (help | version | error | greet request) → for a greet request,
`validate` → `Config` or error → `greetings(name, count)` → `Outcome` → `emit` writes stdout
or stderr bytes and sets `process.exitCode` → Node.js flushes and exits.

## 4. Key design decisions

| # | Decision | Alternatives considered | Rationale |
| :-- | :-- | :-- | :-- |
| D1 | Pure core `run(args) → Outcome` with a thin I/O shell | Writing from inside the parser | Error atomicity (FR-11) by construction; end-to-end unit tests without processes |
| D2 | Hand-written parser returning a discriminated union | `node:util.parseArgs`, commander | Neither reproduces CONV-13 messages or the CONV-12 scan order exactly |
| D3 | Errors as values (`ParseResult`, `Validated<T>`); no exceptions escape | Throwing errors to `main` | A total function cannot crash or print a stack trace (CONV-24) |
| D4 | Buffer the whole output (≤ 1000 short lines) and write it once | Streaming line by line | At most ~1 MB for the longest names; one write is simplest and fastest |
| D5 | `process.exitCode`, never `process.exit()` | `process.exit(status)` | Asynchronous writes (Windows pipes) are flushed before exit |
| D6 | ES modules compiled by `tsc` to `dist/`; tests run on the compiled output | ts-node/tsx at run time | No extra runtime dependency; the tested code is the shipped code |
| D7 | Validate operands, then name, then count, after the scan | Report an operand as soon as it is seen | Matches CONV-10 (interleaving) and CONV-12 (`--help` after an operand wins) |

## 5. Cross-platform strategy
Node.js abstracts the platform; `output.ts` is the only module that touches the streams.
Line endings: every generated line ends in `\n` and is written as a `Buffer`; Node.js never
translates LF to CRLF on any OS (CONV-03), so no binary-mode switch is needed. Arguments:
Node.js decodes POSIX argv as UTF-8 and builds Windows argv from the UTF-16 command line, so
`process.argv` holds the exact text and `Buffer.from(text, "utf8")` re-encodes it (CONV-05).
No paths are used (CONV-19 … CONV-21 do not apply). The launcher is a `#!` script; on
Windows the black-box runner starts `node` itself, and users use Git Bash or MSYS2.

## 6. Error handling and diagnostics
Parsing and validation report usage errors as values holding the CONV-13 message text
(without the tool prefix). `cli.ts::usageError` is the single place that adds the
`dp-hello: ` prefix and the CONV-14 hint, empties stdout, and sets exit status 2. Help and
version return status 0. A failed write (EPIPE) is swallowed by the stream error listeners in
`output.ts` (CONV-25).

## 7. Non-functional design

| Quality attribute | SRS reference | How the design achieves it |
| :-- | :-- | :-- |
| Performance / memory | NFR-02 | One small module graph, no dependencies at run time, a single write; about 0.15 s per run locally (limit 300 ms interpreted) |
| Portability | NFR-01 | LF-only strings written as UTF-8 buffers; CI on Linux, macOS, Windows |
| Robustness | NFR-03 | Total parser/validator, no exceptions escape, stream errors handled |
| Security / input validation | NFR-07 | Only `process.argv` is read; no files, environment, or subprocesses |
| Maintainability | NFR-04 | One module per unit (parse, validate, greet, output); strict TypeScript, ESLint |
| Testability | NFR-05 | Pure `greeting.ts` and `run`; injected streams in `emit` |

## 8. Risks and open issues

| Risk / issue | Likelihood | Impact | Mitigation |
| :-- | :-- | :-- | :-- |
| Invalid UTF-8 bytes in POSIX argv are replaced by U+FFFD by Node.js | L | L | Outside CONV-05 (arguments are UTF-8); documented in the LLD |
| Extensionless launcher module type changes between Node.js releases | L | H | Package is `"type": "module"`; CI runs the launcher on all three OSes |
| NFR-02 memory: Node.js 24's baseline RSS (~48 MiB for `node -e 0`) exceeds 32 MiB | H (certain) | L | Accepted runtime limit, recorded in the RTM gaps; dp-hello adds < 2 MiB over the baseline |
| Tool versions drift between container and native CI | L | M | All tools are pinned in `package-lock.json` and installed by `npm ci` |

## 9. Approval

| Role | Name | Date | Decision |
| :-- | :-- | :-- | :-- |
| Author | Brandon Perkins (with Claude Code) | 2026-10-13 | Submitted |
| Reviewer | Pull-request review | 2026-10-13 | Pending |
