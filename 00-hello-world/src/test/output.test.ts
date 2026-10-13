import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { emit, type ByteSink, type ProcessLike } from "../output.js";

/** A stream double that records the raw bytes written and the error listeners added. */
class RecordingSink implements ByteSink {
  readonly chunks: Uint8Array[] = [];
  readonly errorListeners: ((error: Error) => void)[] = [];

  write(chunk: Uint8Array): boolean {
    this.chunks.push(chunk);
    return true;
  }

  on(_event: "error", listener: (error: Error) => void): this {
    this.errorListeners.push(listener);
    return this;
  }

  bytes(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

function fakeProcess(): ProcessLike & { stdout: RecordingSink; stderr: RecordingSink } {
  return { stdout: new RecordingSink(), stderr: new RecordingSink(), exitCode: undefined };
}

describe("emit", () => {
  it("writes stdout as UTF-8 bytes with LF only and sets the exit status", () => {
    const proc = fakeProcess();
    emit({ stdout: "Hello, Zoë!\n", stderr: "", status: 0 }, proc);
    assert.deepEqual(proc.stdout.bytes(), Buffer.from("48656c6c6f2c205a6fc3ab210a", "hex"));
    assert.equal(proc.stdout.chunks.length, 1);
    assert.equal(proc.stderr.chunks.length, 0);
    assert.equal(proc.exitCode, 0);
  });

  it("writes stderr only for a usage error", () => {
    const proc = fakeProcess();
    emit({ stdout: "", stderr: "dp-hello: x\n", status: 2 }, proc);
    assert.equal(proc.stdout.chunks.length, 0);
    assert.deepEqual(proc.stderr.bytes(), Buffer.from("dp-hello: x\n", "utf8"));
    assert.equal(proc.exitCode, 2);
  });

  it("swallows stream errors such as EPIPE", () => {
    const proc = fakeProcess();
    emit({ stdout: "Hello, World!\n", stderr: "", status: 0 }, proc);
    assert.equal(proc.stdout.errorListeners.length, 1);
    assert.equal(proc.stderr.errorListeners.length, 1);
    const epipe = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    for (const listener of [...proc.stdout.errorListeners, ...proc.stderr.errorListeners]) {
      assert.doesNotThrow(() => {
        listener(epipe);
      });
    }
  });
});
