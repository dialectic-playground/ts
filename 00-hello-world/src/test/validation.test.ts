import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GreetRequest } from "../options.js";
import { validate, validateCount, validateName } from "../validation.js";

const count = (value: string, spelled = "-c") => validateCount({ value, spelled });

function request(fields: Partial<Omit<GreetRequest, "kind">>): GreetRequest {
  return {
    kind: "greet",
    name: fields.name,
    count: fields.count,
    firstOperand: fields.firstOperand,
  };
}

describe("validateCount", () => {
  it("accepts the boundaries 1 and 1000", () => {
    assert.deepEqual(count("1"), { ok: true, value: 1 });
    assert.deepEqual(count("1000"), { ok: true, value: 1000 });
  });

  it("rejects the boundaries 0 and 1001", () => {
    assert.deepEqual(count("0"), { ok: false, message: "invalid argument '0' for '-c'" });
    assert.deepEqual(count("1001"), { ok: false, message: "invalid argument '1001' for '-c'" });
  });

  it("allows leading zeros", () => {
    assert.deepEqual(count("007"), { ok: true, value: 7 });
    assert.deepEqual(count("0001000"), { ok: true, value: 1000 });
    assert.equal(count("000").ok, false);
  });

  it("rejects huge all-digit values without overflow", () => {
    assert.equal(count("9".repeat(400)).ok, false);
    assert.equal(count("18446744073709551617").ok, false);
  });

  it("rejects empty values and non-digits", () => {
    for (const value of ["", "abc", "+5", "-5", " 5", "5 ", "1e3", "3.0", "0x10", "٣", "５"]) {
      assert.deepEqual(count(value, "--count"), {
        ok: false,
        message: `invalid argument '${value}' for '--count'`,
      });
    }
  });
});

describe("validateName", () => {
  it("accepts any non-empty name", () => {
    assert.deepEqual(validateName({ value: " ", spelled: "-n" }), { ok: true, value: " " });
  });

  it("rejects the empty name with the option as written", () => {
    assert.deepEqual(validateName({ value: "", spelled: "-n" }), {
      ok: false,
      message: "invalid argument '' for '-n'",
    });
    assert.deepEqual(validateName({ value: "", spelled: "--name" }), {
      ok: false,
      message: "invalid argument '' for '--name'",
    });
  });
});

describe("validate", () => {
  it("applies the defaults", () => {
    assert.deepEqual(validate(request({})), { ok: true, value: { name: "World", count: 1 } });
  });

  it("uses the given values", () => {
    const result = validate(
      request({ name: { value: "Zoë", spelled: "-n" }, count: { value: "3", spelled: "-c" } }),
    );
    assert.deepEqual(result, { ok: true, value: { name: "Zoë", count: 3 } });
  });

  it("rejects an operand before checking values", () => {
    const result = validate(request({ name: { value: "", spelled: "-n" }, firstOperand: "x" }));
    assert.deepEqual(result, { ok: false, message: "extra operand 'x'" });
  });

  it("checks the name before the count", () => {
    const result = validate(
      request({ name: { value: "", spelled: "--name" }, count: { value: "0", spelled: "-c" } }),
    );
    assert.deepEqual(result, { ok: false, message: "invalid argument '' for '--name'" });
  });
});
