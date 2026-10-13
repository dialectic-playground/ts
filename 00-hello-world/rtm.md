# Requirements Traceability Matrix (RTM) — Standard Terminal Hello World

| Field | Value |
| :-- | :-- |
| Project | `00-hello-world` |
| Tools | dp-hello |
| Author | Brandon Perkins (with Claude Code) |
| Version / date | 1.0 — 2026-10-13 |

Code paths are relative to `00-hello-world/`. Unit tests are cited as
`<file>: <suite> / <test>`; all live in `src/test/`. Public black-box tests are P01–P10.

## 1. User requirements to system requirements

| User requirement (URD) | Derived system requirements (SRS) |
| :-- | :-- |
| UR-01 | FR-01 |
| UR-02 | FR-02 |
| UR-03 | FR-04 |
| UR-04 | FR-07 |
| UR-05 | FR-08 |
| UR-06 | FR-03, FR-05, FR-09, FR-10, FR-11 |
| UR-07 | FR-01, SRS §3.7 |
| UR-08 | NFR-01, CONV-03 |
| UR-09 | FR-02, CONV-05 |
| UR-10 | FR-06, FR-10, CONV-07 … CONV-15 |
| UR-11 | NFR-02 |
| UR-12 | NFR-06 |

## 2. Forward traceability

| Req. ID | Summary | Design (HLD/LLD) | Code (file::function) | Verification (unit / black-box) | Status |
| :-- | :-- | :-- | :-- | :-- | :-- |
| UR-01 … UR-12 | User requirements | via §1 | via the derived FR/NFR rows | via the derived FR/NFR rows | Verified |
| FR-01 | Default greeting | HLD §3.3; LLD §3.3–3.5, §7 | `src/validation.ts::validate`, `src/greeting.ts::greetingLine` | `cli.test.ts`: run / prints the default greeting; `validation.test.ts`: validate / applies the defaults; P01 | Verified |
| FR-02 | Named greeting, verbatim UTF-8 | LLD §3.1–3.2, §3.4 | `src/options.ts::parseArgs`, `src/greeting.ts::greetingLine` | `options.test.ts`: accepts -n NAME and -nNAME, accepts --name NAME and --name=NAME, accepts values that begin with a dash, keeps non-ASCII values verbatim; `greeting.test.ts`: keeps non-ASCII names verbatim; P02, P03, P04 | Verified |
| FR-03 | Empty name rejected | LLD §3.3 | `src/validation.ts::validateName` | `validation.test.ts`: validateName / rejects the empty name with the option as written; `cli.test.ts`: reports usage errors … | Verified |
| FR-04 | Repetition 1–1000, leading zeros | LLD §3.3–3.4 | `src/validation.ts::validateCount`, `src/greeting.ts::greetings` | `validation.test.ts`: accepts the boundaries 1 and 1000, allows leading zeros; `greeting.test.ts`: repeats the line count times, returns 1000 lines …; P05, P06 | Verified |
| FR-05 | Invalid count rejected | LLD §3.3 | `src/validation.ts::validateCount` | `validation.test.ts`: rejects the boundaries 0 and 1001, rejects empty values and non-digits, rejects huge all-digit values without overflow | Verified |
| FR-06 | Last occurrence wins | LLD §3.1 | `src/options.ts::parseArgs` | `options.test.ts`: lets the last occurrence win, keeping its spelling; `cli.test.ts`: validates only the winning value | Verified |
| FR-07 | Help, scan order | HLD D7; LLD §3.1, §3.5 | `src/cli.ts::run`, `HELP_TEXT` | `cli.test.ts`: prints the help text byte for byte; `options.test.ts`: stops at the first of them; P07 | Verified |
| FR-08 | Version | LLD §3.5 | `src/cli.ts::run`, `VERSION_TEXT` | `cli.test.ts`: prints the version line; P08 | Verified |
| FR-09 | Operands rejected | LLD §3.1, §3.3 | `src/options.ts::parseArgs`, `src/validation.ts::validate` | `options.test.ts`: treats every token after -- as an operand; `validation.test.ts`: rejects an operand before checking values; `cli.test.ts`: reports usage errors …; P10 | Verified |
| FR-10 | Unknown / malformed options | LLD §3.2 | `src/options.ts::parseLong`, `parseShort`, `takeNext` | `options.test.ts`: parseArgs: usage errors (all tests); P09 | Verified |
| FR-11 | No stdout on error | HLD D1; LLD §2.4 | `src/cli.ts::usageError` | `cli.test.ts`: reports usage errors on stderr only, with exit status 2; `output.test.ts`: writes stderr only for a usage error; P09, P10 | Verified |
| NFR-01 | Byte-identical, LF only | HLD §5; LLD §5 | `src/output.ts::emit` | `output.test.ts`: writes stdout as UTF-8 bytes with LF only …; P01–P10 on Linux, macOS, Windows (CI) | Verified |
| NFR-02 | < 300 ms (interpreted), < 32 MiB | HLD §7, §8 | whole program | Measurement: ~0.15 s per run (`-c 1000`); RSS ~50 MiB (see §5) | Implemented |
| NFR-03 | No crash / stack trace | HLD D3; LLD §3.1 | `src/options.ts::parseArgs`, `src/output.ts::emit` | `options.test.ts`: parseArgs: usage errors; `output.test.ts`: swallows stream errors such as EPIPE | Verified |
| NFR-04 | Separate units | HLD §3.2 | `src/options.ts`, `src/validation.ts`, `src/greeting.ts`, `src/output.ts` | Design review (LLD §8) | Verified |
| NFR-05 | Pure, unit-tested greeting | LLD §3.4 | `src/greeting.ts::greetingLine`, `greetings` | `greeting.test.ts` (all tests) | Verified |
| NFR-06 | All Makefile targets | README; `Makefile` | `Makefile` hooks `DP_*` | CI `make check roundtrip` (3 OSes), container `make check` | Verified |
| NFR-07 | No files, env, subprocesses | HLD §7 | `src/main.ts` (reads only `process.argv`) | Inspection: no `fs`, `process.env`, or `child_process` import in `src/` | Verified |
| CONV-01 | Canonical name | LLD §3.5 | `src/cli.ts::TOOL` | `cli.test.ts`: reports usage errors …; P07–P10 | Verified |
| CONV-02 | Version line | LLD §3.5 | `src/cli.ts::VERSION_TEXT` | `cli.test.ts`: prints the version line; P08 | Verified |
| CONV-03 | LF output, binary writes | HLD §5 | `src/output.ts::emit` | `output.test.ts`: writes stdout as UTF-8 bytes with LF only …; P01–P10 (CI, Windows) | Verified |
| CONV-05 | UTF-8 arguments | HLD §5; LLD §5 | `src/output.ts::emit`, `process.argv` | `output.test.ts` (Zoë bytes); `options.test.ts`: keeps non-ASCII values verbatim | Verified |
| CONV-06 | Locale-independent, no colors | HLD §7 | `src/cli.ts::run` | Inspection; P01–P10 run under a minimal environment | Verified |
| CONV-07 | Short options, attached values | LLD §3.2 | `src/options.ts::parseShort` | `options.test.ts`: accepts bundled short options …, lets a short option consume the rest of its token; P06 | Verified |
| CONV-08 | Long options, no abbreviations | LLD §3.2 | `src/options.ts::parseLong` | `options.test.ts`: accepts --name NAME and --name=NAME, rejects unknown and abbreviated long options …; P04 | Verified |
| CONV-09 | `--` terminator | LLD §3.1 | `src/options.ts::parseArgs` | `options.test.ts`: treats every token after -- as an operand, accepts a lone -- | Verified |
| CONV-10 | Operands, `-`, interleaving | LLD §3.1 | `src/options.ts::parseArgs` | `options.test.ts`: treats a lone dash as an operand, allows options after an operand; P10 | Verified |
| CONV-11 | Repetition | LLD §3.1 | `src/options.ts::parseArgs` | `options.test.ts`: lets the last occurrence win, keeping its spelling | Verified |
| CONV-12 | Scan order, errors before output | HLD D1, D7 | `src/options.ts::parseArgs`, `src/cli.ts::run` | `options.test.ts`: stops at the first of them, reports an earlier usage error instead; `cli.test.ts`: prints the help text byte for byte | Verified |
| CONV-13 | Exact usage diagnostics | LLD §2.5 | `src/options.ts`, `src/validation.ts`, `src/cli.ts::usageError` | `options.test.ts`: parseArgs: usage errors; `cli.test.ts`: reports usage errors …; P09, P10 | Verified |
| CONV-14 | Hint line, exit 2 | LLD §2.5 | `src/cli.ts::usageError` | `cli.test.ts`: reports usage errors …; P09, P10 | Verified |
| CONV-15 | Values quoted verbatim | LLD §3.3 | `src/validation.ts` (`invalid`) | `validation.test.ts`: rejects the empty name …, rejects empty values and non-digits | Verified |
| CONV-18 | Exit statuses 0 / 2 | HLD §6 | `src/cli.ts::EXIT_SUCCESS`, `EXIT_USAGE`; `src/output.ts::emit` | `cli.test.ts` (status in every case); `output.test.ts`; P01–P10 | Verified |
| CONV-22 | `--help`, `--version` take no argument | LLD §3.2 | `src/options.ts::parseLong` | `options.test.ts`: rejects an argument to --help or --version | Verified |
| CONV-23 | Help text verbatim | LLD §3.5 | `src/cli.ts::HELP_TEXT` | `cli.test.ts`: prints the help text byte for byte; P07 | Verified |
| CONV-24 | No crash | HLD D3 | `src/options.ts::parseArgs` (total) | as NFR-03 | Verified |
| CONV-25 | EPIPE ends quietly | HLD §6; LLD §3.6 | `src/output.ts::emit` | `output.test.ts`: swallows stream errors such as EPIPE | Verified |
| CONV-26 | Stdin not read | HLD §3.1 | `src/main.ts` (no stdin access) | Inspection; P01–P10 run with stdin at the null device | Verified |
| CONV-27 … CONV-30 | Black-box harness conditions | HLD §5 (launcher) | `bin/dp-hello` | P01–P10 (runner) on Linux, macOS, Windows | Verified |

Not applicable (dp-hello copies no input data and uses no paths or files): CONV-04,
CONV-16, CONV-17, CONV-19, CONV-20, CONV-21.

## 3. Backward traceability (test → requirement)

| Test | Type | Requirement(s) verified |
| :-- | :-- | :-- |
| P01 | black-box, public | FR-01, NFR-01, CONV-03 |
| P02, P03 | black-box, public | FR-02 |
| P04 | black-box, public | FR-02, CONV-08 |
| P05 | black-box, public | FR-04 |
| P06 | black-box, public | FR-04, CONV-07 |
| P07 | black-box, public | FR-07, CONV-23 |
| P08 | black-box, public | FR-08, CONV-02 |
| P09 | black-box, public | FR-10, FR-11, CONV-13, CONV-14 |
| P10 | black-box, public | FR-09, FR-11, CONV-13, CONV-14 |
| `options.test.ts`: parseArgs: options | unit | FR-02, FR-06, CONV-07, CONV-08, CONV-11 |
| `options.test.ts`: parseArgs: operands and -- | unit | FR-09, CONV-09, CONV-10 |
| `options.test.ts`: parseArgs: --help and --version (scan order) | unit | FR-07, FR-08, CONV-12 |
| `options.test.ts`: parseArgs: usage errors | unit | FR-10, CONV-13, CONV-22, NFR-03 |
| `validation.test.ts`: validateCount | unit | FR-04, FR-05, CONV-15 |
| `validation.test.ts`: validateName | unit | FR-03, CONV-15 |
| `validation.test.ts`: validate | unit | FR-01, FR-06, FR-09 |
| `greeting.test.ts`: greetingLine, greetings | unit | FR-01, FR-02, FR-04, NFR-05 |
| `cli.test.ts`: run | unit (end to end, in process) | FR-01 … FR-11, CONV-01, CONV-02, CONV-14, CONV-23 |
| `output.test.ts`: emit | unit | NFR-01, CONV-03, CONV-05, CONV-25 |

## 4. Coverage summary

| Category | Total | Designed | Implemented | Verified |
| :-- | :-- | :-- | :-- | :-- |
| User requirements (UR) | 12 | 12 | 12 | 11 |
| Functional (FR) | 11 | 11 | 11 | 11 |
| Non-functional (NFR) | 7 | 7 | 7 | 6 |
| Conventions (CONV, applicable) | 24 | 24 | 24 | 24 |

## 5. Gaps and justifications

- **NFR-02 (and UR-11), memory:** run time meets the interpreted-runtime limit (about 0.15 s
  locally for `-c 1000`), but peak RSS is about 50 MiB, against a 32 MiB limit. The Node.js 24
  runtime alone uses about 48 MiB (`node -e 0`), and V8 flags such as `--max-semi-space-size`
  or `--jitless` do not lower it below 32 MiB. dp-hello itself adds under 2 MiB. This is a
  property of the chosen runtime, accepted for the TypeScript implementation; no plan beyond
  re-measuring on future Node.js releases.
