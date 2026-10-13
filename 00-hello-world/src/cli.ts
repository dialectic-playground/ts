/**
 * The dp-hello program as a pure function: arguments in, output text and exit status out.
 *
 * `run` composes parsing, validation, and greeting construction, and it is the one place
 * where usage errors become CONV-13/CONV-14 diagnostics and exit status 2. It performs no
 * I/O; `output.ts` writes its result.
 */

import { greetings } from "./greeting.js";
import { parseArgs } from "./options.js";
import { validate } from "./validation.js";

/** Canonical tool name used in every diagnostic, the help text, and the version line (CONV-01). */
export const TOOL = "dp-hello";

/** Exit statuses (SRS section 3.7). */
export const EXIT_SUCCESS = 0;
export const EXIT_USAGE = 2;

/** The normative help text (user manual, "Help output"; CONV-23). */
export const HELP_TEXT = `Usage: ${TOOL} [OPTION]...
Print a greeting to standard output.

Options:
  -n, --name=NAME     greet NAME instead of World
  -c, --count=COUNT   print the greeting COUNT times (1-1000, default 1)
      --help          display this help and exit
      --version       output version information and exit
`;

/** The version line (CONV-02). */
export const VERSION_TEXT = `${TOOL} (dialectic-playground) 1.0.0\n`;

/** What one invocation writes and how it exits. */
export interface Outcome {
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number;
}

/** Run dp-hello on `args` (the arguments after the program name). Never throws. */
export function run(args: readonly string[]): Outcome {
  const parsed = parseArgs(args);
  switch (parsed.kind) {
    case "help":
      return success(HELP_TEXT);
    case "version":
      return success(VERSION_TEXT);
    case "error":
      return usageError(parsed.message);
    case "greet": {
      const config = validate(parsed);
      return config.ok
        ? success(greetings(config.value.name, config.value.count))
        : usageError(config.message);
    }
  }
}

/** Format a usage error as the CONV-13 line plus the CONV-14 hint (FR-11: stdout is empty). */
export function usageError(message: string): Outcome {
  return {
    stdout: "",
    stderr: `${TOOL}: ${message}\nTry '${TOOL} --help' for more information.\n`,
    status: EXIT_USAGE,
  };
}

function success(stdout: string): Outcome {
  return { stdout, stderr: "", status: EXIT_SUCCESS };
}
