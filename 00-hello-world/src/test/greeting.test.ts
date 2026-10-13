import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { greetingLine, greetings } from "../greeting.js";

describe("greetingLine", () => {
  it("greets World with a single LF", () => {
    assert.equal(greetingLine("World"), "Hello, World!\n");
  });

  it("keeps spaces, punctuation, and case verbatim", () => {
    assert.equal(greetingLine("ada LOVELACE, Esq."), "Hello, ada LOVELACE, Esq.!\n");
  });

  it("keeps non-ASCII names verbatim", () => {
    assert.equal(greetingLine("Zoë 世界 🙂"), "Hello, Zoë 世界 🙂!\n");
  });

  it("keeps a name that starts with a dash", () => {
    assert.equal(greetingLine("-x"), "Hello, -x!\n");
  });
});

describe("greetings", () => {
  it("returns one line for count 1", () => {
    assert.equal(greetings("Ada", 1), "Hello, Ada!\n");
  });

  it("repeats the line count times", () => {
    assert.equal(greetings("Ken", 3), "Hello, Ken!\n".repeat(3));
  });

  it("returns 1000 lines for the maximum count", () => {
    const text = greetings("W", 1000);
    assert.equal(text.split("\n").length - 1, 1000);
    assert.ok(!text.includes("\r"));
  });

  it("returns an empty string for count 0", () => {
    assert.equal(greetings("Ada", 0), "");
  });
});
