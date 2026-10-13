/**
 * Command-line parsing for dp-hello (CONV-07 ... CONV-13, SRS section 3.2).
 *
 * The parser is hand-written: no third-party argument parser reproduces the exact CONV-13
 * diagnostics. It only recognizes the syntax; checking option values is the job of
 * `validation.ts`.
 */

/** A raw option value together with the option as the user spelled it (`-n` or `--name`). */
export interface OptionValue {
  readonly value: string;
  readonly spelled: string;
}

/** The arguments asked for a greeting. Values are unvalidated; the last occurrence wins. */
export interface GreetRequest {
  readonly kind: "greet";
  readonly name: OptionValue | undefined;
  readonly count: OptionValue | undefined;
  readonly firstOperand: string | undefined;
}

/** The result of a parse: what the invocation asks for, or the first syntactic error. */
export type ParseResult =
  | GreetRequest
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | { readonly kind: "error"; readonly message: string };

type Field = "name" | "count";

/** Options that take a value: short letter or long name -> the field they set. */
const SHORT_VALUED: ReadonlyMap<string, Field> = new Map([
  ["n", "name"],
  ["c", "count"],
]);
const LONG_VALUED: ReadonlyMap<string, Field> = new Map([
  ["name", "name"],
  ["count", "count"],
]);
const LONG_FLAGS: ReadonlyMap<string, "help" | "version"> = new Map([
  ["help", "help"],
  ["version", "version"],
]);

/** Thrown inside the parser for a syntactic usage error; never escapes `parseArgs`. */
class SyntaxUsageError extends Error {}

/** The parser's working state: the token list, the read position, and the values seen. */
interface Scanner {
  readonly args: readonly string[];
  index: number;
  readonly values: Map<Field, OptionValue>;
}

/**
 * Parse the arguments (without the interpreter and script names) from left to right.
 *
 * Returns as soon as `--help` or `--version` is reached (CONV-12), or the first syntactic
 * usage error met before that point. Operands are collected, and the first one is reported
 * by validation (FR-09). Never throws.
 */
export function parseArgs(args: readonly string[]): ParseResult {
  const scanner: Scanner = { args, index: 0, values: new Map() };
  const operands: string[] = [];
  try {
    while (scanner.index < args.length) {
      const token = args[scanner.index++] ?? "";
      if (token === "--") {
        operands.push(...args.slice(scanner.index));
        break;
      }
      if (token.startsWith("--")) {
        const flag = parseLong(token, scanner);
        if (flag !== undefined) {
          return { kind: flag };
        }
      } else if (token.startsWith("-") && token !== "-") {
        parseShort(token, scanner);
      } else {
        operands.push(token);
      }
    }
  } catch (error) {
    if (error instanceof SyntaxUsageError) {
      return { kind: "error", message: error.message };
    }
    throw error;
  }
  return {
    kind: "greet",
    name: scanner.values.get("name"),
    count: scanner.values.get("count"),
    firstOperand: operands[0],
  };
}

/** Handle one `--long[=value]` token (CONV-08); returns the flag it selects, if any. */
function parseLong(token: string, scanner: Scanner): "help" | "version" | undefined {
  const equals = token.indexOf("=");
  const name = equals < 0 ? token.slice(2) : token.slice(2, equals);
  const flag = LONG_FLAGS.get(name);
  if (flag !== undefined) {
    if (equals >= 0) {
      throw new SyntaxUsageError(`option '--${name}' doesn't allow an argument`);
    }
    return flag;
  }
  const field = LONG_VALUED.get(name);
  if (field === undefined) {
    throw new SyntaxUsageError(`unrecognized option '${token}'`);
  }
  const value =
    equals >= 0
      ? token.slice(equals + 1)
      : takeNext(scanner, `option '--${name}' requires an argument`);
  scanner.values.set(field, { value, spelled: `--${name}` });
  return undefined;
}

/** Handle one `-x...` token (CONV-07). Both short options take a value. */
function parseShort(token: string, scanner: Scanner): void {
  // Index by code point, so that an unknown non-ASCII option letter is reported whole.
  const letter = String.fromCodePoint(token.codePointAt(1) ?? 0);
  const field = SHORT_VALUED.get(letter);
  if (field === undefined) {
    throw new SyntaxUsageError(`invalid option -- '${letter}'`);
  }
  // A short option with a value consumes the rest of the token, or else the next token.
  const attached = token.slice(1 + letter.length);
  const value =
    attached !== "" ? attached : takeNext(scanner, `option requires an argument -- '${letter}'`);
  scanner.values.set(field, { value, spelled: `-${letter}` });
}

/** Consume the next token as an option's value, or fail with `missing` if there is none. */
function takeNext(scanner: Scanner, missing: string): string {
  const next = scanner.args[scanner.index];
  if (next === undefined) {
    throw new SyntaxUsageError(missing);
  }
  scanner.index++;
  return next;
}
