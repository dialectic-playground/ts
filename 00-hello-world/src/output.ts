/**
 * Byte-exact output (CONV-03, CONV-05, CONV-25): the only module that touches the streams.
 *
 * Text is encoded to UTF-8 here and written as raw bytes. Node.js never translates LF into
 * CRLF on any platform, and it decodes the command line as UTF-8 on POSIX and from the UTF-16
 * command line on Windows, so the bytes written are exactly the arguments' UTF-8 encoding.
 */

import type { Outcome } from "./cli.js";

/** The parts of a writable stream that `emit` uses (process.stdout, or a test double). */
export interface ByteSink {
  write(chunk: Uint8Array): boolean;
  on(event: "error", listener: (error: Error) => void): unknown;
}

/** The parts of `process` that `emit` uses. */
export interface ProcessLike {
  readonly stdout: ByteSink;
  readonly stderr: ByteSink;
  exitCode?: number | string | null | undefined;
}

/**
 * Write the outcome's text to the streams, each as one UTF-8 buffer, and set the exit
 * status. The status is set with `exitCode` rather than `process.exit()`, so Node.js exits
 * only after asynchronous writes (pipes on Windows) have been flushed.
 */
export function emit(outcome: Outcome, proc: ProcessLike): void {
  // A reader that went away (EPIPE) ends the output silently (CONV-25): without a listener,
  // the stream's error event would crash the process with a stack trace (CONV-24).
  proc.stdout.on("error", ignore);
  proc.stderr.on("error", ignore);
  if (outcome.stdout !== "") {
    proc.stdout.write(Buffer.from(outcome.stdout, "utf8"));
  }
  if (outcome.stderr !== "") {
    proc.stderr.write(Buffer.from(outcome.stderr, "utf8"));
  }
  proc.exitCode = outcome.status;
}

function ignore(): void {
  // Deliberately empty: see emit.
}
