import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validate } from "./validate.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** A copy of the repository to break one thing in. */
function copy() {
  const dir = mkdtempSync(join(tmpdir(), "pbc-mcp-repo-"));
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !src.includes("node_modules") && !src.endsWith(".git") });
  return dir;
}

const edit = (dir, file, change) => {
  const path = join(dir, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  change(data);
  writeFileSync(path, JSON.stringify(data, null, 2));
};

test("the repository as committed passes", () => {
  assert.deepEqual(validate(ROOT), []);
});

test("an endpoint that differs from server.json is caught", () => {
  const dir = copy();
  edit(dir, "gemini-extension.json", (g) => {
    g.mcpServers.pocketbasecloud.httpUrl = "https://example.com/mcp";
  });
  assert.match(validate(dir).join("\n"), /gemini-extension\.json.*endpoint/);
});

test("a manifest whose version drifted is caught", () => {
  const dir = copy();
  edit(dir, ".cursor-plugin/plugin.json", (p) => {
    p.version = "9.9.9";
  });
  assert.match(validate(dir).join("\n"), /version/);
});

test("a skill whose name is not its folder's is caught", () => {
  const dir = copy();
  const path = join(dir, "skills/debug-deploy/SKILL.md");
  writeFileSync(path, readFileSync(path, "utf8").replace("name: debug-deploy", "name: Debug Deploy"));
  assert.match(validate(dir).join("\n"), /skills\/debug-deploy/);
});

test("a server.json description over the Registry's 100 characters is caught", () => {
  const dir = copy();
  edit(dir, "server.json", (s) => {
    s.description = "x".repeat(101);
  });
  assert.match(validate(dir).join("\n"), /server\.json.*description/);
});

test("a manifest path that points nowhere is caught", () => {
  const dir = copy();
  edit(dir, ".claude-plugin/plugin.json", (p) => {
    p.skills = "./no-such-folder/";
  });
  assert.match(validate(dir).join("\n"), /no-such-folder/);
});
