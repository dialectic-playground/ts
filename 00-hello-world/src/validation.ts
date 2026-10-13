/** Validation of a parsed greeting request (FR-03, FR-05, FR-06, FR-09). */

import type { GreetRequest, OptionValue } from "./options.js";

export const DEFAULT_NAME = "World";
export const DEFAULT_COUNT = 1;
export const MIN_COUNT = 1;
export const MAX_COUNT = 1000;

/** A validated greeting request: `name` is non-empty and `1 <= count <= 1000`. */
export interface Config {
  readonly name: string;
  readonly count: number;
}

/** Either a valid value or a usage-error message (without the `dp-hello: ` prefix). */
export type Validated<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly message: string };

/** Turn a greet request into a Config. Operands are rejected first, then the option values. */
export function validate(request: GreetRequest): Validated<Config> {
  if (request.firstOperand !== undefined) {
    return { ok: false, message: `extra operand '${request.firstOperand}'` };
  }
  const name = request.name === undefined ? ok(DEFAULT_NAME) : validateName(request.name);
  if (!name.ok) {
    return name;
  }
  const count = request.count === undefined ? ok(DEFAULT_COUNT) : validateCount(request.count);
  if (!count.ok) {
    return count;
  }
  return ok({ name: name.value, count: count.value });
}

/** The name may be anything except the empty string (FR-02, FR-03). */
export function validateName(option: OptionValue): Validated<string> {
  return option.value === "" ? invalid(option) : ok(option.value);
}

/** The count: ASCII digits only (leading zeros allowed), value 1-1000 (FR-04, FR-05). */
export function validateCount(option: OptionValue): Validated<number> {
  if (!/^[0-9]+$/.test(option.value)) {
    return invalid(option);
  }
  // Strip leading zeros first so that a huge all-digit string is never converted to a number.
  const significant = option.value.replace(/^0+/, "");
  if (significant.length > String(MAX_COUNT).length) {
    return invalid(option);
  }
  const value = Number(significant === "" ? "0" : significant);
  return value >= MIN_COUNT && value <= MAX_COUNT ? ok(value) : invalid(option);
}

function ok<T>(value: T): Validated<T> {
  return { ok: true, value };
}

function invalid<T>(option: OptionValue): Validated<T> {
  return { ok: false, message: `invalid argument '${option.value}' for '${option.spelled}'` };
}
