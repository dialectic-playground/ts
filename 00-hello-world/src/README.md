<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Source workspace: 00-hello-world (TypeScript)](#source-workspace-00-hello-world-typescript)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Source workspace: 00-hello-world (TypeScript)

`dp-hello` as an npm package of ES modules, compiled by `tsc` (see `../tsconfig.json`) to
`../dist/`. The design is in `../hld.md` and `../lld.md`.

| File             | Unit                  | Responsibility                                                        |
| :--------------- | :-------------------- | :-------------------------------------------------------------------- |
| `options.ts`     | parsing               | `parseArgs`: argv tokens to a parse result (CONV-07 … CONV-13)        |
| `validation.ts`  | validation            | `validate`, `validateName`, `validateCount` (FR-03, FR-05, FR-09)     |
| `greeting.ts`    | greeting construction | `greetingLine`, `greetings`: pure functions (NFR-05)                  |
| `cli.ts`         | program core          | `run(args)`: pure; output text and exit status; help and version text |
| `output.ts`      | output                | `emit`: UTF-8 bytes to stdout/stderr, exit status (CONV-03, CONV-25)  |
| `main.ts`        | entry point           | `emit(run(process.argv.slice(2)), process)`                           |
| `test/*.test.ts` | unit tests            | `node:test` suites, one per unit, run on the compiled `dist/test/`    |

The launcher `../bin/dp-hello` (`BIN_DIR`) imports `../dist/main.js`.
