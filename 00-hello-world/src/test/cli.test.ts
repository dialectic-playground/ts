import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HELP_TEXT, run, VERSION_TEXT } from "../cli.js";

const HINT = "Try 'dp-hello --help' for more information.\n";

function usage(message: string) {
  return { stdout: "", stderr: `dp-hello: ${message}\n${HINT}`, status: 2 };
}

function ok(stdout: string) {
  return { stdout, stderr: "", status: 0 };
}

describe("run", () => {
  it("prints the default greeting", () => {
    assert.deepEqual(run([]), ok("Hello, World!\n"));
  });

  it("prints a named, repeated greeting", () => {
    assert.deepEqual(run(["-c2", "-n", "Ken"]), ok("Hello, Ken!\nHello, Ken!\n"));
    assert.deepEqual(run(["--name", "Ada Lovelace"]), ok("Hello, Ada Lovelace!\n"));
    assert.deepEqual(run(["-n", "Zoë"]), ok("Hello, Zoë!\n"));
  });

  it("prints the help text byte for byte", () => {
    assert.equal(
      HELP_TEXT,
      "Usage: dp-hello [OPTION]...\n" +
        "Print a greeting to standard output.\n" +
        "\n" +
        "Options:\n" +
        "  -n, --name=NAME     greet NAME instead of World\n" +
        "  -c, --count=COUNT   print the greeting COUNT times (1-1000, default 1)\n" +
        "      --help          display this help and exit\n" +
        "      --version       output version information and exit\n",
    );
    assert.deepEqual(run(["--help", "extra", "-x"]), ok(HELP_TEXT));
  });

  it("prints the version line", () => {
    assert.equal(VERSION_TEXT, "dp-hello (dialectic-playground) 1.0.0\n");
    assert.deepEqual(run(["--version"]), ok(VERSION_TEXT));
  });

  it("reports usage errors on stderr only, with exit status 2", () => {
    assert.deepEqual(run(["-x"]), usage("invalid option -- 'x'"));
    assert.deepEqual(run(["--nme", "Ada"]), usage("unrecognized option '--nme'"));
    assert.deepEqual(run(["--name"]), usage("option '--name' requires an argument"));
    assert.deepEqual(run(["--version=1"]), usage("option '--version' doesn't allow an argument"));
    assert.deepEqual(run(["--name", ""]), usage("invalid argument '' for '--name'"));
    assert.deepEqual(run(["-c", "1001"]), usage("invalid argument '1001' for '-c'"));
    assert.deepEqual(run(["extra"]), usage("extra operand 'extra'"));
    assert.deepEqual(run(["--", "-n"]), usage("extra operand '-n'"));
  });

  it("validates only the winning value", () => {
    assert.deepEqual(run(["-c", "0", "-c", "1"]), ok("Hello, World!\n"));
    assert.deepEqual(run(["-n", "", "-n", "B"]), ok("Hello, B!\n"));
  });
});
