#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standardPath = join(root, "docs/zh-CN/agentic-spec-standard.md");
const skillsRoot = join(root, ".agents/skills");

const standard = readFileSync(standardPath, "utf8");
const section = standard
  .split("## 13.4 Agentic Spec 必备 Skill 清单")[1]
  ?.split("# 14.")[0];

if (!section) {
  throw new Error("Cannot find Agentic Spec required skill section in agentic-spec-standard.md.");
}

const SKILL_SLUG_PATTERN = /^(?:using-agent-skills|\d{2}\.[a-z0-9-]+\.[a-z0-9-]+)$/;
const required = Array.from(section.matchAll(/^(?:using-agent-skills|\d{2}\.[a-z0-9-]+\.[a-z0-9-]+)$/gm), (match) => match[0]);
const requiredSet = new Set(required);
const entries = readdirSync(skillsRoot)
  .filter((entry) => statSync(join(skillsRoot, entry)).isDirectory())
  .sort();
const entrySet = new Set(entries);

const missing = required.filter((slug) => !entrySet.has(slug));
const extra = entries.filter((slug) => !requiredSet.has(slug));
const invalid = entries.filter((slug) => !SKILL_SLUG_PATTERN.test(slug));
const mismatched = [];

for (const slug of entries) {
  const skillPath = join(skillsRoot, slug, "SKILL.md");
  const content = readFileSync(skillPath, "utf8");
  const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (name !== slug) {
    mismatched.push(`${slug}: name is ${name ?? "<missing>"}`);
  }
}

if (missing.length || extra.length || invalid.length || mismatched.length) {
  if (missing.length) console.error(`Missing skills:\n${missing.join("\n")}`);
  if (extra.length) console.error(`Extra skills:\n${extra.join("\n")}`);
  if (invalid.length) console.error(`Invalid skill slugs:\n${invalid.join("\n")}`);
  if (mismatched.length) console.error(`Frontmatter mismatches:\n${mismatched.join("\n")}`);
  process.exit(1);
}

console.log(`Agentic Spec skill catalog is valid (${entries.length} skills).`);
