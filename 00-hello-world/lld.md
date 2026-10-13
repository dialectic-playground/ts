# Low-Level Design (LLD) — Standard Terminal Hello World

| Field | Value |
| :-- | :-- |
| Project | `00-hello-world` |
| Tools | dp-hello |
| Implementation language | TypeScript 6.0 on Node.js 24 (ES modules, compiled by `tsc`) |
| Author | Brandon Perkins (with Claude Code) |
| Version / date | 1.0 — 2026-10-13 |
| Status | Approved |
| Inputs | `hld.md`, `specs/SRS.md`, `shared/CLI-CONVENTIONS.md` |

## 1. Source layout

```text
00-hello-world/
├── package.json, package-lock.json   # "type": "module"; exact-pinned dev tools
├── tsconfig.json                     # strict; src/ → dist/; module nodenext; newLine lf
├── eslint.config.js, .prettierrc.json, .prettierignore
├── bin/dp-hello                      # BIN_DIR launcher: #!/usr/bin/env node; import "../dist/main.js"
└── src/
    ├── options.ts      # parsing: parseArgs
    ├── validation.ts   # validation: validate, validateName, validateCount
    ├── greeting.ts     # greeting construction: greetingLine, greetings
    ├── cli.ts          # core: run, usageError, HELP_TEXT, VERSION_TEXT
    ├── output.ts       # output: emit
    ├── main.ts         # entry point
    └── test/           # node:test suites: options, validation, greeting, cli, output (*.test.ts)
```

## 2. Data types

### 2.1 `OptionValue` (`options.ts`)
| Field | Type | Constraint / invariant | SRS |
| :-- | :-- | :-- | :-- |
| `value` | `string` | Raw value, possibly empty | FR-02, FR-04 |
| `spelled` | `string` | `-n`, `--name`, `-c`, or `--count` as written | FR-03, FR-05, CONV-13 |

### 2.2 `ParseResult` (`options.ts`)
A discriminated union on `kind`: `{kind: "help"}`, `{kind: "version"}`,
`{kind: "error", message}`, or `GreetRequest` = `{kind: "greet", name, count, firstOperand}`
where `name`/`count` are the last `OptionValue` seen (or `undefined`, CONV-11) and
`firstOperand` is the first operand (or `undefined`).

### 2.3 `Config` and `Validated<T>` (`validation.ts`)
`Config` = `{name: string, count: number}` with `name !== ""` and `1 <= count <= 1000`;
defaults `World` and 1. `Validated<T>` = `{ok: true, value: T} | {ok: false, message}`.

### 2.4 `Outcome` (`cli.ts`)
`{stdout: string, stderr: string, status: number}`; exactly one of `stdout`/`stderr` is
non-empty, and `stdout === ""` whenever `status === 2` (FR-11).

### 2.5 Usage errors
Every error is a message (without the `dp-hello: ` prefix); `cli.ts::usageError` produces:

| Variant (message) | Diagnostic (stderr) | Exit status |
| :-- | :-- | :-- |
| `invalid option -- 'x'` | `dp-hello: <message>` + LF + `Try 'dp-hello --help' for more information.` + LF | 2 |
| `unrecognized option '<token>'` | same form | 2 |
| `option requires an argument -- 'n'` / `'c'` | same form | 2 |
| `option '--name' requires an argument` / `'--count'` | same form | 2 |
| `option '--help' doesn't allow an argument` / `'--version'` | same form | 2 |
| `invalid argument '<value>' for '<option>'` | same form | 2 |
| `extra operand '<operand>'` | same form | 2 |

## 3. Module and function specifications

### 3.1 `parseArgs` (`options.ts`)
- **Signature:** `parseArgs(args: readonly string[]): ParseResult`
- **Responsibility:** read the tokens left to right and classify them (CONV-07 … CONV-12).
- **Postconditions:** returns help/version at the first `--help`/`--version`; the first
  syntactic error before that; otherwise a `GreetRequest`. Never throws.
- **Algorithm:** for each token: `--` → the remaining tokens are operands, stop; starts with
  `--` → `parseLong`; starts with `-` and is not `-` → `parseShort`; else operand. Internal
  helpers throw a private `SyntaxUsageError`, which `parseArgs` converts into `{kind: "error"}`.
- **Complexity:** O(total argument length) time and memory.
- **Satisfies:** FR-02, FR-06, FR-07, FR-08, FR-10, CONV-07 … CONV-13.
- **Unit tests:** `src/test/options.test.ts` (suites `parseArgs: options`, `parseArgs:
  operands and --`, `parseArgs: --help and --version (scan order)`, `parseArgs: usage errors`).

### 3.2 `parseLong` / `parseShort` / `takeNext` (`options.ts`, private)
- `parseLong(token, scanner)`: split at the first `=`; `help`/`version` with `=` → "doesn't
  allow an argument", else return the flag; `name`/`count` take the inline value or the next
  token (`takeNext`), else "requires an argument"; any other name → "unrecognized option"
  with the full token (no abbreviations, CONV-08).
- `parseShort(token, scanner)`: the option letter is the first code point after `-`; `n`/`c`
  take the rest of the token, or the next token if the rest is empty (CONV-07); any other
  letter → "invalid option". The next token is taken even if it starts with `-` (FR-02).

### 3.3 `validate`, `validateName`, `validateCount` (`validation.ts`)
- **Signatures:** `validate(request: GreetRequest): Validated<Config>`,
  `validateName(option: OptionValue): Validated<string>`,
  `validateCount(option: OptionValue): Validated<number>`.
- **Algorithm:** `validate` rejects `firstOperand` (FR-09), then validates the winning name,
  then the winning count (FR-06), applying defaults. `validateName` rejects `""` (FR-03).
  `validateCount` requires `/^[0-9]+$/`, strips leading zeros, rejects more than four
  significant digits (no huge-number conversion), then checks 1 ≤ value ≤ 1000 (FR-04, FR-05).
- **Errors:** `invalid argument '<value>' for '<spelled>'`, `extra operand '<operand>'`.
- **Unit tests:** `src/test/validation.test.ts` (suites `validateCount`, `validateName`, `validate`).

### 3.4 `greetingLine`, `greetings` (`greeting.ts`)
- **Signatures:** `greetingLine(name: string): string`; `greetings(name: string, count: number): string`.
- **Responsibility:** pure construction of `Hello, NAME!\n`, repeated `count` times (NFR-05).
- **Unit tests:** `src/test/greeting.test.ts` (suites `greetingLine`, `greetings`).

### 3.5 `run`, `usageError` (`cli.ts`)
- **Signatures:** `run(args: readonly string[]): Outcome`; `usageError(message: string): Outcome`.
- **Algorithm:** `switch` on `parseArgs(args).kind`: help → `HELP_TEXT`; version →
  `VERSION_TEXT`; error → `usageError`; greet → `validate`, then `greetings` or `usageError`.
- **Satisfies:** FR-01 … FR-11, CONV-01, CONV-02, CONV-13 … CONV-15, CONV-23.
- **Unit tests:** `src/test/cli.test.ts` (suite `run`).

### 3.6 `emit` (`output.ts`)
- **Signature:** `emit(outcome: Outcome, proc: ProcessLike): void`
- **Algorithm:** add no-op `error` listeners to stdout and stderr (CONV-25); write non-empty
  stdout/stderr text as one `Buffer.from(text, "utf8")` each; set `proc.exitCode`.
- **Unit tests:** `src/test/output.test.ts` (suite `emit`, with recording stream doubles).

### 3.7 `main.ts`
Top-level statement `emit(run(process.argv.slice(2)), process)`; `process.argv[0..1]` are
the node binary and the script.

## 4. Algorithms
The only non-trivial algorithm is the option scan (§3.1–3.2), a single left-to-right pass
with an index that value-taking options advance. COUNT validation avoids converting huge
digit strings: after stripping leading zeros, more than four digits is out of range.

## 5. Platform-specific details

| Concern | Linux | macOS | Windows | Abstraction |
| :-- | :-- | :-- | :-- | :-- |
| Argument decoding | argv bytes decoded as UTF-8 by Node.js | same | UTF-16 command line (`GetCommandLineW`) → JS strings | `process.argv` |
| Newline translation | none | none | none (Node.js writes bytes as given) | `output.ts::emit` |
| stdout to a pipe | synchronous write | synchronous | asynchronous; flushed before exit because `process.exitCode` is used | `output.ts::emit` |
| Launching `bin/dp-hello` | kernel `#!` → `/usr/bin/env node` | same | runner (or Git Bash) starts `node bin/dp-hello` | launcher |
| Installed launcher | `#!/bin/sh` + `exec node '<abs path>'` | same | same, under Git Bash; the path is single-quoted, so `D:\a\…` survives | `Makefile` `DP_INSTALL` |

Invalid UTF-8 in POSIX argv is replaced by U+FFFD by Node.js before the program sees it;
CONV-05 defines arguments as UTF-8, so this is outside the specified input domain.

## 6. Resource management
No files, sockets, or child processes are opened. Output is held in one string of at most
1000 lines and written once; stdout/stderr are owned by Node.js and closed at exit.

## 7. Sequence of one invocation (`dp-hello`, public test P01)
1. The runner starts `bin/dp-hello`; Node.js loads it as an ES module and imports `dist/main.js`.
2. `main.ts` calls `run([])`; `parseArgs([])` returns `{kind: "greet", name: undefined, count: undefined, firstOperand: undefined}`.
3. `validate` returns `{ok: true, value: {name: "World", count: 1}}`; `greetings("World", 1)` → `"Hello, World!\n"`.
4. `run` returns `{stdout: "Hello, World!\n", stderr: "", status: 0}`.
5. `emit` writes the 14 bytes to stdout and sets `process.exitCode = 0`; Node.js exits 0.

## 8. Design-to-code checklist

| HLD component | LLD section | Source file(s) | Unit-test file(s) |
| :-- | :-- | :-- | :-- |
| parsing | §3.1–3.2 | `src/options.ts` | `src/test/options.test.ts` |
| validation | §3.3 | `src/validation.ts` | `src/test/validation.test.ts` |
| greeting | §3.4 | `src/greeting.ts` | `src/test/greeting.test.ts` |
| core | §3.5 | `src/cli.ts` | `src/test/cli.test.ts` |
| output | §3.6 | `src/output.ts` | `src/test/output.test.ts` |
| entry / launcher | §3.7, §5 | `src/main.ts`, `bin/dp-hello` | public black-box suite P01–P10 |
