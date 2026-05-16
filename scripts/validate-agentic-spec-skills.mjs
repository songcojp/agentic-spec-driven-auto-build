#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const skillsRoot = join(root, ".agents/skills");

const required = [
  "clean-worktree",
  "collect-project-context",
  "generate-user-stories",
  "setup-worktree",
  "decompose-feature-specs",
  "design-architecture",
  "design-ui-spec",
  "implement-feature",
  "manage-spec-change",
  "package-evidence",
  "plan-feature-execution",
  "prepare-release",
  "recover-execution",
  "refine-product-intent",
  "review-code-spec",
  "review-delivery-evidence",
  "use-specdrive-lifecycle",
  "validate-requirements",
  "verify-behavior",
].sort();

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const rootFiles = readdirSync(skillsRoot)
  .filter((entry) => statSync(join(skillsRoot, entry)).isFile())
  .sort();
const entries = readdirSync(skillsRoot)
  .filter((entry) => statSync(join(skillsRoot, entry)).isDirectory())
  .sort();
const requiredSet = new Set(required);
const entrySet = new Set(entries);

const missing = required.filter((name) => !entrySet.has(name));
const extra = entries.filter((name) => !requiredSet.has(name));
const invalid = entries.filter((name) => !SKILL_NAME_PATTERN.test(name) || name.includes("."));
const mismatched = [];
const missingDescriptions = [];
const missingOpenAiYaml = [];
const invalidOpenAiYaml = [];
const forbiddenFiles = rootFiles.filter((entry) => entry !== ".gitkeep");

for (const name of entries) {
  const skillPath = join(skillsRoot, name, "SKILL.md");
  if (!existsSync(skillPath)) {
    mismatched.push(`${name}: missing SKILL.md`);
    continue;
  }
  const content = readFileSync(skillPath, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatterText = frontmatter?.[1] ?? "";
  const frontmatterKeys = [...frontmatterText.matchAll(/^([A-Za-z0-9_-]+):/gm)].map((match) => match[1]);
  const unsupportedKeys = frontmatterKeys.filter((key) => key !== "name" && key !== "description");
  const frontmatterName = frontmatterText.match(/^name:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  const description = frontmatterText.match(/^description:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  if (unsupportedKeys.length > 0) {
    mismatched.push(`${name}: unsupported frontmatter keys ${unsupportedKeys.join(", ")}`);
  }
  if (frontmatterName !== name) {
    mismatched.push(`${name}: name is ${frontmatterName ?? "<missing>"}`);
  }
  if (!description) {
    missingDescriptions.push(`${name}: description is missing or empty`);
  }
  const openaiYaml = join(skillsRoot, name, "agents/openai.yaml");
  if (!existsSync(openaiYaml)) {
    missingOpenAiYaml.push(name);
  } else {
    const yaml = readFileSync(openaiYaml, "utf8");
    if (!/interface:\n/.test(yaml)
      || !/display_name:\s*".+"/.test(yaml)
      || !/short_description:\s*".+"/.test(yaml)
      || !new RegExp(`default_prompt:\\s*\"[^\"]*\\$${name}[^\\\"]*\"`).test(yaml)) {
      invalidOpenAiYaml.push(name);
    }
  }
}

if (missing.length || extra.length || invalid.length || mismatched.length || missingDescriptions.length || missingOpenAiYaml.length || invalidOpenAiYaml.length || forbiddenFiles.length) {
  if (missing.length) console.error(`Missing skills:\n${missing.join("\n")}`);
  if (extra.length) console.error(`Extra skills:\n${extra.join("\n")}`);
  if (invalid.length) console.error(`Invalid skill names:\n${invalid.join("\n")}`);
  if (mismatched.length) console.error(`Frontmatter mismatches:\n${mismatched.join("\n")}`);
  if (missingDescriptions.length) console.error(`Missing descriptions:\n${missingDescriptions.join("\n")}`);
  if (missingOpenAiYaml.length) console.error(`Missing agents/openai.yaml:\n${missingOpenAiYaml.join("\n")}`);
  if (invalidOpenAiYaml.length) console.error(`Invalid agents/openai.yaml:\n${invalidOpenAiYaml.join("\n")}`);
  if (forbiddenFiles.length) console.error(`Root files are not allowed under .agents/skills:\n${forbiddenFiles.join("\n")}`);
  process.exit(1);
}

console.log(`OpenAI-style SpecDrive skill catalog is valid (${entries.length} skills).`);
