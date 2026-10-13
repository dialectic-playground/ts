/** Entry point of dp-hello: the thin I/O shell around the pure `run` function. */

import { run } from "./cli.js";
import { emit } from "./output.js";

// process.argv is [node, script, ...arguments]; only the arguments matter (CONV-01).
emit(run(process.argv.slice(2)), process);
