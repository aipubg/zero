import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { ok, strictEqual } from "node:assert";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distIndex = join(root, "dist", "control-ui");

// The Control UI build writes a standalone JSON manifest into dist/. Validate the
// exact generation it declares instead of guessing from readdir order: old
// immutable generations are intentionally retained under dist/control-ui/.
const manifestPath = join(root, "dist", "openclaw.plugin.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

ok(typeof manifest.controlUi?.entry === "string", "generated manifest is missing controlUi.entry");

const manifestEntry = manifest.controlUi.entry;
const manifestGeneration = manifestEntry
  .replace(/^\.\//, "")
  .replace(/^dist\/control-ui\//, "")
  .replace(/\/index\.js$/, "");

ok(
  /^[a-f0-9]{64}$/.test(manifestGeneration),
  `generated manifest entry does not name a generation; got ${manifestEntry}`,
);

const names = await readdir(distIndex);
ok(
  names.includes(manifestGeneration),
  `generated manifest entry points at a missing generation; got ${manifestEntry}; dir names=${JSON.stringify(names.slice(0, 3))}...`,
);

const indexJs = join(distIndex, manifestGeneration, "index.js");
const indexCss = join(distIndex, manifestGeneration, "index.css");
const [entryStat, cssStat] = await Promise.all([stat(indexJs), stat(indexCss)]);

ok(Array.isArray(manifest.controlUi.styles) && manifest.controlUi.styles.length > 0, "generated manifest is missing controlUi.styles");

beltAndSuspenders:
{
  ok(entryStat.isFile(), "index.js is not a file");
  ok(cssStat.isFile(), "index.css is not a file");
  strictEqual(typeof manifest.controlUi.entry, "string");
  strictEqual(Array.isArray(manifest.controlUi.styles), true);
  strictEqual(manifest.controlUi.styles.length, 1);
  strictEqual(manifest.controlUi.styles[0], `dist/control-ui/${manifestGeneration}/index.css`);
  strictEqual(manifest.controlUi.entry, `dist/control-ui/${manifestGeneration}/index.js`);
  strictEqual(entryStat.size > 0, true);
  strictEqual(cssStat.size > 0, true);
}

console.log("✔ served entry file verified:", indexJs);
console.log("✔ served styles file verified:", indexCss);
console.log("✔ generation =", manifestGeneration);
console.log("✔ generated manifest entry generation =", manifestGeneration);
console.log("✔ generated manifest points to existing immutable assets");
