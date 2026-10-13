# Master Test Plan (MTP) — Standard Terminal Hello World

| Field | Value |
| :-- | :-- |
| Project | `00-hello-world` |
| Tools | dp-hello |
| Implementation language | TypeScript 6.0 on Node.js 24 |
| Author | Brandon Perkins (with Claude Code) |
| Version / date | 1.0 — 2026-10-13 |
| Standard | Structure adapted from IEEE 829 / ISO/IEC/IEEE 29119-3 |

## 1. Introduction and scope

### 1.1 Objectives
"Tested enough" means: every SRS acceptance criterion (FR-01 … FR-11) is exercised by a unit
test or a black-box test, every CONV-13 diagnostic is checked byte for byte, the public and
hidden suites pass on Linux, macOS, and Windows, and `make lint` is clean.

### 1.2 In scope / out of scope
| In scope | Out of scope |
| :-- | :-- |
| Every FR/NFR in the SRS and every applicable CONV, on Linux, macOS, and Windows | Node.js and npm themselves; terminal font rendering |
| The Makefile contract (`all install uninstall test lint format clean distclean`) | Invalid UTF-8 argument bytes (outside CONV-05; see LLD §5) |

## 2. Test items

| Item | Version / location |
| :-- | :-- |
| dp-hello | `00-hello-world/src/` (compiled to `dist/`), launcher `bin/dp-hello`, branch `feat/00-hello-world` |
| Unit tests | `00-hello-world/src/test/*.test.ts` (54 tests in 11 suites) |
| Public black-box suite | `tests/public/` (10 tests) |
| Hidden black-box suite | `tests/private/` (10 tests, run by CI) |

## 3. Test levels and approach

| Level | Purpose | Technique(s) | Tooling | Owner |
| :-- | :-- | :-- | :-- | :-- |
| Unit | Parser, validator, greeting, output in isolation | Equivalence partitioning, boundary values | `node:test` + `node:assert/strict` on the `tsc` output | developer |
| Integration | parse → validate → greet → outcome, in process | Specification-based | `node:test` (`cli.test.ts`, suite `run`) | developer |
| System (black-box) | The CLI behavior, byte-exact | Specification-based | `make test` → `run-tests.py` | developer |
| Acceptance | Hidden suite on all OSes | — | CI `make check` (`test-hidden`) | CI |
| Static analysis | Types, lint, format | — | `make lint`: `tsc --noEmit` (strict), ESLint (typescript-eslint strict type-checked), `prettier --check` | developer / CI |

## 4. Test design

### 4.1 Equivalence partitions and boundaries

| Input | Valid partitions | Invalid partitions | Boundaries |
| :-- | :-- | :-- | :-- |
| NAME | Non-empty: ASCII, spaces, non-ASCII, leading `-` | Empty | `""` vs one character |
| COUNT | Digit strings with value 1–1000, leading zeros | Empty, sign, space, `.`, letters, non-ASCII digits, 0, > 1000, huge | 0, 1, 1000, 1001; `000`, `0001000` |
| Option tokens | `-n`, `-nV`, `--name V`, `--name=V`, same for count, `--help`, `--version`, `--` | Unknown short/long, abbreviations, missing values, `--help=…` | Last token missing its value |
| Operands | none | Any operand, `-`, tokens after `--` | first operand reported |

### 4.2 Additional test cases (beyond the supplied suite)

| ID | Requirement(s) | Preconditions | Steps / command | Expected result | Level |
| :-- | :-- | :-- | :-- | :-- | :-- |
| T-01 | FR-04, FR-05 | — | `validateCount` with `1`, `1000`, `0`, `1001` | 1 and 1000 accepted; 0 and 1001 rejected | unit |
| T-02 | FR-04 | — | `validateCount("007")`, `("0001000")`, `("000")` | 7, 1000, rejected | unit |
| T-03 | FR-05 | — | `validateCount` with `+5`, `-5`, ` 5`, `1e3`, `3.0`, `0x10`, `٣`, `５`, `""` | each rejected with the exact message | unit |
| T-04 | FR-05, NFR-03 | — | `validateCount` with 400 nines | rejected, no overflow | unit |
| T-05 | FR-03 | — | `run(["--name", ""])` | `invalid argument '' for '--name'`, exit 2 | unit |
| T-06 | FR-06 | — | `run(["-c", "0", "-c", "1"])` | one greeting (only the winner is validated) | unit |
| T-07 | CONV-07 | — | `parseArgs(["-nc2"])` | name `c2` (value consumes the rest of the token) | unit |
| T-08 | FR-02 | — | `parseArgs(["-n", "--help"])`, `["--name=-x"]`, `["-n-x"]` | values taken verbatim | unit |
| T-09 | FR-07, CONV-12 | — | `parseArgs(["extra", "--help"])`, `["-x", "--help"]` | help; then `invalid option -- 'x'` | unit |
| T-10 | FR-09, CONV-09 | — | `run(["--", "-n"])`, `parseArgs(["-"])` | `extra operand '-n'`; `-` is an operand | unit |
| T-11 | FR-10, CONV-08 | — | `parseArgs(["--nam"])`, `["--x=1"]`, `["---"]` | `unrecognized option` with the full token | unit |
| T-12 | CONV-03, CONV-05 | — | `emit` of `Hello, Zoë!\n` to a recording stream | bytes `48 65 … c3 ab 21 0a`, one write | unit |
| T-13 | CONV-25 | — | invoke `emit`'s error listeners with an EPIPE error | no exception | unit |
| T-14 | NFR-06 | temporary PREFIX | `make roundtrip` | install prints the version; uninstall leaves no files | system (CI) |

### 4.3 Negative and robustness testing
All CONV-13 error variants are covered by `options.test.ts` (suite `parseArgs: usage
errors`) and `cli.test.ts` (exact stderr, empty stdout, status 2). Non-ASCII option letters,
huge counts, and empty values are included. EPIPE handling is unit-tested with stream
doubles; manually, `dp-hello -c 1000 | head -1` exits quietly. There is no stdin, file, or
large-input surface.

### 4.4 Performance and resource testing
NFR-02 is measured with `/usr/bin/time -v bin/dp-hello -c 1000 > /dev/null`: wall time about
0.15 s (limit 300 ms for an interpreted runtime); peak RSS about 50 MiB, dominated by the
Node.js runtime (see RTM §5).

## 5. Test environments

| Environment | OS / version | Toolchain | How provisioned |
| :-- | :-- | :-- | :-- |
| Container | Debian trixie (`node:24-trixie-slim`) | Node.js 24, npm, tools from `package-lock.json` | `Containerfile`, `make check` |
| Local | Fedora 44 | Node.js 22 (native) + the same locked tools | `DP_RUNTIME=local make test` |
| CI | ubuntu-latest, macos-latest, windows-latest | `actions/setup-node` (24), Python 3.12, GNU Make | `.github/workflows/ci.yml` (`make check roundtrip`) |

## 6. Entry and exit criteria

- **Entry:** HLD/LLD written, `make all` succeeds, `make lint` is clean.
- **Exit:** all unit tests pass; public and hidden suites pass on all three OSes in CI;
  `make roundtrip` passes natively; `make format` leaves no diff; every RTM row is Verified
  or has a justified gap.
- **Suspension / resumption:** suspend on a failing CI job; resume after the fix and a
  regression test.

## 7. Defect management
Defects are GitHub issues in this repository with a severity label. Every fix adds a unit
test that fails without it, and CI re-runs every suite on all three OSes.

| Severity | Definition |
| :-- | :-- |
| 1 — Critical | Crash, stack trace, or wrong output on a mainline path |
| 2 — Major | Wrong diagnostic, exit status, or bytes on one platform |
| 3 — Minor | Documentation, lint, or build-hygiene issue |

## 8. Schedule and deliverables

| Milestone | Deliverable | Target date |
| :-- | :-- | :-- |
| Design complete | `hld.md`, `lld.md` | 2026-10-13 |
| Implementation complete | `src/`, unit tests, Makefile hooks | 2026-10-13 |
| Verification complete | RTM, CI green | 2026-10-13 |

## 9. Risks and contingencies

| Risk | Mitigation |
| :-- | :-- |
| Windows-only failure (launcher, paths, pipes) | CI runs the native job on Windows from the first commit |
| Tool drift between container and native | Exact versions in `package-lock.json`, installed with `npm ci` |
| Node.js changes how extensionless files load | Black-box suites run the launcher on every OS in CI |

## 10. Test summary

| Metric | Value |
| :-- | :-- |
| Unit tests (pass / total) | 54 / 54 |
| Coverage (line / branch) | 99.7% / 98.2% of `dist/` (`node --test --experimental-test-coverage`); uncovered: the defensive re-throw in `parseArgs` |
| Public black-box (pass / 10) | 10 / 10 (container and local) |
| Hidden black-box (pass / 10, from CI) | 10 / 10 |
| Open defects by severity | none |
