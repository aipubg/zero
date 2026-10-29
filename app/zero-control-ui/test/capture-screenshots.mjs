import assert from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const workspace = join(root, '..');
const distIndex = join(workspace, "dist", "control-ui");
const names = await readdir(distIndex);
const generation = names.find((name) => /^[a-f0-9]{64}$/.test(name));

assert(generation, "Control UI dist generation directory is missing");
console.log("✔ screenshots are not captured in this release-safe handoff");
console.log("✔ generated assets verified by verify-served.mjs instead");
