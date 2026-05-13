import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRunWorkpad } from "../src/workpad.ts";

test("run workpad creates markdown and json evidence index under autobuild runs", () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "run-workpad-"));

  const workpad = createRunWorkpad({
    workspaceRoot,
    executionId: "RUN/WORKPAD:001",
    featureId: "FEAT-023",
    taskId: "T-023-13",
  });

  assert.equal(workpad.markdownPath, ".autobuild/runs/RUN-WORKPAD-001/WORKPAD.md");
  assert.equal(workpad.jsonPath, ".autobuild/runs/RUN-WORKPAD-001/workpad.json");
  assert.equal(existsSync(join(workspaceRoot, workpad.markdownPath)), true);
  assert.equal(existsSync(join(workspaceRoot, workpad.jsonPath)), true);

  const markdown = readFileSync(join(workspaceRoot, workpad.markdownPath), "utf8");
  assert.match(markdown, /## Runtime Validation/);
  assert.match(markdown, /Reload persistence verified/);
  assert.match(markdown, /featureId=FEAT-023/);

  const json = JSON.parse(readFileSync(join(workspaceRoot, workpad.jsonPath), "utf8")) as typeof workpad;
  assert.equal(json.executionId, "RUN/WORKPAD:001");
  assert.equal(json.sections.runtimeValidation.includes("Screenshot/trace/log attached"), true);
});
