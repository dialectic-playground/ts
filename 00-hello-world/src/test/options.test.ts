import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseArgs, type ParseResult } from "../options.js";

function greet(
  name?: [string, string],
  count?: [string, string],
  firstOperand?: string,
): ParseResult {
  return {
    kind: "greet",
    name: name && { value: name[0], spelled: name[1] },
    count: count && { value: count[0], spelled: count[1] },
    firstOperand,
  };
}

function error(message: string): ParseResult {
  return { kind: "error", message };
}

describe("parseArgs: options", () => {
  it("returns defaults for no arguments", () => {
    assert.deepEqual(parseArgs([]), greet());
  });

  it("accepts -n NAME and -nNAME", () => {
    assert.deepEqual(parseArgs(["-n", "Grace"]), greet(["Grace", "-n"]));
    assert.deepEqual(parseArgs(["-nGrace"]), greet(["Grace", "-n"]));
  });

  it("accepts --name NAME and --name=NAME", () => {
    assert.deepEqual(parseArgs(["--name", "Ada"]), greet(["Ada", "--name"]));
    assert.deepEqual(parseArgs(["--name=Linus"]), greet(["Linus", "--name"]));
  });

  it("accepts an empty attached long value and keeps further = signs", () => {
    assert.deepEqual(parseArgs(["--name="]), greet(["", "--name"]));
    assert.deepEqual(parseArgs(["--name=a=b"]), greet(["a=b", "--name"]));
  });

  it("accepts a separate empty value", () => {
    assert.deepEqual(parseArgs(["-n", ""]), greet(["", "-n"]));
  });

  it("accepts bundled short options with attached values", () => {
    assert.deepEqual(parseArgs(["-c2", "-nKen"]), greet(["Ken", "-n"], ["2", "-c"]));
  });

  it("lets a short option consume the rest of its token", () => {
    assert.deepEqual(parseArgs(["-nc2"]), greet(["c2", "-n"]));
  });

  it("accepts --count COUNT and --count=COUNT", () => {
    assert.deepEqual(parseArgs(["--count", "3"]), greet(undefined, ["3", "--count"]));
    assert.deepEqual(parseArgs(["--count=3"]), greet(undefined, ["3", "--count"]));
  });

  it("accepts values that begin with a dash", () => {
    assert.deepEqual(parseArgs(["--name", "-x"]), greet(["-x", "--name"]));
    assert.deepEqual(parseArgs(["--name=-x"]), greet(["-x", "--name"]));
    assert.deepEqual(parseArgs(["-n-x"]), greet(["-x", "-n"]));
    assert.deepEqual(parseArgs(["-n", "--help"]), greet(["--help", "-n"]));
  });

  it("lets the last occurrence win, keeping its spelling", () => {
    assert.deepEqual(parseArgs(["-n", "A", "--name", "B"]), greet(["B", "--name"]));
    assert.deepEqual(parseArgs(["--count=1", "-c", "x"]), greet(undefined, ["x", "-c"]));
  });

  it("keeps non-ASCII values verbatim", () => {
    assert.deepEqual(parseArgs(["-nZoë"]), greet(["Zoë", "-n"]));
  });
});

describe("parseArgs: operands and --", () => {
  it("collects the first operand", () => {
    assert.deepEqual(parseArgs(["extra", "more"]), greet(undefined, undefined, "extra"));
  });

  it("treats a lone dash as an operand", () => {
    assert.deepEqual(parseArgs(["-"]), greet(undefined, undefined, "-"));
  });

  it("allows options after an operand", () => {
    assert.deepEqual(parseArgs(["extra", "-n", "A"]), greet(["A", "-n"], undefined, "extra"));
  });

  it("treats every token after -- as an operand", () => {
    assert.deepEqual(parseArgs(["--", "-n"]), greet(undefined, undefined, "-n"));
    assert.deepEqual(parseArgs(["--", "--help"]), greet(undefined, undefined, "--help"));
  });

  it("accepts a lone --", () => {
    assert.deepEqual(parseArgs(["--"]), greet());
  });
});

describe("parseArgs: --help and --version (scan order)", () => {
  it("recognizes --help and --version", () => {
    assert.deepEqual(parseArgs(["--help"]), { kind: "help" });
    assert.deepEqual(parseArgs(["--version"]), { kind: "version" });
  });

  it("stops at the first of them", () => {
    assert.deepEqual(parseArgs(["--help", "extra", "-x"]), { kind: "help" });
    assert.deepEqual(parseArgs(["--version", "--help"]), { kind: "version" });
    assert.deepEqual(parseArgs(["extra", "--help"]), { kind: "help" });
  });

  it("reports an earlier usage error instead", () => {
    assert.deepEqual(parseArgs(["-x", "--help"]), error("invalid option -- 'x'"));
  });
});

describe("parseArgs: usage errors", () => {
  it("rejects an unknown short option", () => {
    assert.deepEqual(parseArgs(["-x"]), error("invalid option -- 'x'"));
    assert.deepEqual(parseArgs(["-h"]), error("invalid option -- 'h'"));
  });

  it("reports a non-ASCII short option letter whole", () => {
    assert.deepEqual(parseArgs(["-ë"]), error("invalid option -- 'ë'"));
  });

  it("rejects unknown and abbreviated long options with the full token", () => {
    assert.deepEqual(parseArgs(["--nme", "Ada"]), error("unrecognized option '--nme'"));
    assert.deepEqual(parseArgs(["--nam"]), error("unrecognized option '--nam'"));
    assert.deepEqual(parseArgs(["--x=1"]), error("unrecognized option '--x=1'"));
    assert.deepEqual(parseArgs(["---"]), error("unrecognized option '---'"));
  });

  it("rejects short options without an argument", () => {
    assert.deepEqual(parseArgs(["-n"]), error("option requires an argument -- 'n'"));
    assert.deepEqual(parseArgs(["-c"]), error("option requires an argument -- 'c'"));
  });

  it("rejects long options without an argument", () => {
    assert.deepEqual(parseArgs(["--name"]), error("option '--name' requires an argument"));
    assert.deepEqual(parseArgs(["--count"]), error("option '--count' requires an argument"));
  });

  it("rejects an argument to --help or --version", () => {
    assert.deepEqual(parseArgs(["--help="]), error("option '--help' doesn't allow an argument"));
    assert.deepEqual(
      parseArgs(["--version=1"]),
      error("option '--version' doesn't allow an argument"),
    );
  });

  it("reports the first error only", () => {
    assert.deepEqual(parseArgs(["-y", "-x"]), error("invalid option -- 'y'"));
  });
});
