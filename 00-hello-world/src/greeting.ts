/** Greeting construction (FR-01, FR-02, FR-04): pure functions with no I/O (NFR-05). */

/** Return one greeting line: `Hello, NAME!` followed by a single LF (CONV-03). */
export function greetingLine(name: string): string {
  return `Hello, ${name}!\n`;
}

/** Return `count` greeting lines for `name` (an empty string when `count` is 0). */
export function greetings(name: string, count: number): string {
  return greetingLine(name).repeat(count);
}
