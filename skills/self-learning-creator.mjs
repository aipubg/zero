#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = __dirname;

/**
 * Self-Learning Skill Creator
 * Automatically generates a structured SKILL.md file from a completed workflow,
 * saving it to the persistent skills library for future autonomous reuse.
 */
export function createSkill({
  name,
  description,
  triggers = [],
  capabilities = [],
  workflowSteps = [],
  examples = [],
  overwrite = false,
} = {}) {
  if (!name || typeof name !== "string") {
    throw new Error("Skill name is required and must be a string");
  }

  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const targetDir = path.join(SKILLS_DIR, cleanName);
  const targetFile = path.join(targetDir, "SKILL.md");

  if (fs.existsSync(targetFile) && !overwrite) {
    return { ok: false, reason: "skill-already-exists", path: targetFile };
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const triggersYaml = (triggers.length > 0 ? triggers : [cleanName])
    .map((t) => `  - "${t.replace(/"/g, '\\"')}"`)
    .join("\n");

  const capabilitiesMd = (capabilities.length > 0 ? capabilities : ["Autonomous task execution"])
    .map((c, i) => `${i + 1}. **${c}**`)
    .join("\n");

  const workflowMd = (workflowSteps.length > 0 ? workflowSteps : ["Execute task steps cleanly and verify."])
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  const examplesMd = examples.length > 0
    ? `\n## Examples\n${examples.map((e) => `- ${e}`).join("\n")}`
    : "";

  const content = `---
name: ${cleanName}
description: ${description || `Auto-learned skill for ${cleanName}`}
triggers:
${triggersYaml}
---

# ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1).replace(/-/g, " ")} Skill

${description || "Auto-generated autonomous agent skill."}

## Capabilities
${capabilitiesMd}

## Standard Execution Workflow
${workflowMd}
${examplesMd}
`;

  fs.writeFileSync(targetFile, content, "utf8");

  return {
    ok: true,
    name: cleanName,
    path: targetFile,
    bytes: Buffer.byteLength(content, "utf8"),
  };
}

// CLI usage if run directly
if (process.argv[1] && process.argv[1].endsWith("self-learning-creator.mjs") && process.argv[2]) {
  const name = process.argv[2];
  const desc = process.argv[3] || `Learned skill for ${name}`;
  const res = createSkill({ name, description: desc });
  console.log(JSON.stringify(res, null, 2));
}
