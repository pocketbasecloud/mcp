/**
 * Checks the repository's manifests and skills against each other and against the limits of the places that read
 * them: every manifest parses, points at the same endpoint, carries the same plugin name and version, and names
 * paths that exist; server.json fits the MCP Registry; every skill has metadata whose name matches its folder.
 *
 *   node scripts/validate.mjs        # prints each problem, exits 1 if there is one
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Lowercase letters, digits, hyphens and periods, as the plugin formats require. */
const PLUGIN_NAME = /^[a-z0-9][a-z0-9.-]*$/;
/** The MCP Registry's server name: a reverse-DNS namespace, a slash, a name. */
const REGISTRY_NAME = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;
/** Agent Skills: lowercase letters, digits and hyphens, at most 64 characters. */
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MANIFESTS = [
  "server.json",
  "mcp.json",
  ".mcp.json",
  "plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/plugin.json",
  "gemini-extension.json",
];

/** The single server each MCP configuration declares, or undefined. */
function onlyServer(file, config, errors) {
  const servers = Object.values(config?.mcpServers ?? {});
  if (servers.length !== 1) {
    errors.push(`${file}: mcpServers must hold exactly one server, not ${servers.length}.`);
    return undefined;
  }
  return servers[0];
}

/** name and description from a SKILL.md's front matter (simple `key: value` lines, values optionally quoted). */
function frontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return undefined;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return fields;
}

/** Every problem found in the repository at root, as one line each; empty when it is fine. */
export function validate(root) {
  const errors = [];
  const json = {};
  for (const file of MANIFESTS) {
    try {
      json[file] = JSON.parse(readFileSync(join(root, file), "utf8"));
    } catch (e) {
      errors.push(`${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (errors.length > 0) return errors;

  // server.json, as the MCP Registry reads it.
  const server = json["server.json"];
  if (!REGISTRY_NAME.test(server.name ?? "")) errors.push(`server.json: name "${server.name}" is not a Registry name.`);
  for (const field of ["description", "title"]) {
    const value = server[field] ?? "";
    if (value.length < 1 || value.length > 100) {
      errors.push(`server.json: ${field} must be 1 to 100 characters, not ${value.length}.`);
    }
  }
  const remote = server.remotes?.[0];
  if (server.remotes?.length !== 1 || remote?.type !== "streamable-http" || !remote.url?.startsWith("https://")) {
    errors.push("server.json: remotes must hold one streamable-http entry with an https url.");
  }
  const endpoint = remote?.url;

  // The same endpoint everywhere, in each format's own vocabulary.
  const endpoints = [
    ["mcp.json", onlyServer("mcp.json", json["mcp.json"], errors), "url", "streamable-http"],
    [".mcp.json", onlyServer(".mcp.json", json[".mcp.json"], errors), "url", "http"],
    ["gemini-extension.json", onlyServer("gemini-extension.json", json["gemini-extension.json"], errors), "httpUrl"],
  ];
  for (const [file, entry, key, type] of endpoints) {
    if (!entry) continue;
    if (entry[key] !== endpoint) errors.push(`${file}: endpoint ${entry[key]} differs from server.json's ${endpoint}.`);
    if (type && entry.type !== type) errors.push(`${file}: type must be "${type}", not "${entry.type}".`);
  }

  // One plugin name and one version across the plugin manifests.
  const marketplace = json[".claude-plugin/marketplace.json"];
  const listed = marketplace.plugins?.[0];
  if (marketplace.plugins?.length !== 1) errors.push(".claude-plugin/marketplace.json: plugins must hold one plugin.");
  if (!marketplace.owner?.name) errors.push(".claude-plugin/marketplace.json: owner.name is required.");
  const named = [
    ["plugin.json", json["plugin.json"]],
    [".claude-plugin/plugin.json", json[".claude-plugin/plugin.json"]],
    [".cursor-plugin/plugin.json", json[".cursor-plugin/plugin.json"]],
    [".claude-plugin/marketplace.json plugins[0]", listed ?? {}],
    ["gemini-extension.json", json["gemini-extension.json"]],
  ];
  const name = json["plugin.json"].name;
  for (const [file, manifest] of named) {
    if (!PLUGIN_NAME.test(manifest.name ?? "")) errors.push(`${file}: name "${manifest.name}" is not a valid plugin name.`);
    else if (manifest.name !== name) errors.push(`${file}: name "${manifest.name}" differs from plugin.json's "${name}".`);
  }
  const version = server.version;
  for (const [file, manifest] of [["plugin.json", json["plugin.json"]], ...named.slice(1)]) {
    if (manifest.version !== version) {
      errors.push(`${file}: version ${manifest.version} differs from server.json's ${version}.`);
    }
  }

  // Paths the client manifests point at.
  const paths = [
    [".claude-plugin/plugin.json", json[".claude-plugin/plugin.json"].mcpServers],
    [".claude-plugin/plugin.json", json[".claude-plugin/plugin.json"].skills],
    [".cursor-plugin/plugin.json", json[".cursor-plugin/plugin.json"].mcpServers],
    [".cursor-plugin/plugin.json", json[".cursor-plugin/plugin.json"].skills],
    [".cursor-plugin/plugin.json", json[".cursor-plugin/plugin.json"].logo],
    [".claude-plugin/marketplace.json", listed?.source],
  ];
  for (const [file, path] of paths) {
    if (typeof path !== "string" || path.startsWith("/") || path.includes("..")) {
      errors.push(`${file}: "${path}" must be a relative path inside the repository.`);
    } else if (!existsSync(join(root, path))) {
      errors.push(`${file}: "${path}" does not exist.`);
    }
  }

  // Skills.
  const skillsDir = join(root, "skills");
  const skills = readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  if (skills.length === 0) errors.push("skills/: no skill found.");
  for (const dir of skills) {
    const file = `skills/${dir.name}/SKILL.md`;
    if (!existsSync(join(root, file))) {
      errors.push(`${file}: missing.`);
      continue;
    }
    const meta = frontMatter(readFileSync(join(root, file), "utf8"));
    if (!meta) {
      errors.push(`${file}: no front matter.`);
      continue;
    }
    if (meta.name !== dir.name) errors.push(`${file}: name "${meta.name}" must be the folder's name, "${dir.name}".`);
    if (!SKILL_NAME.test(meta.name ?? "") || meta.name.length > 64) {
      errors.push(`${file}: name "${meta.name}" must be lowercase words joined by hyphens, at most 64 characters.`);
    }
    const description = meta.description ?? "";
    if (description.length < 1 || description.length > 1024) {
      errors.push(`${file}: description must be 1 to 1024 characters, not ${description.length}.`);
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const errors = validate(root);
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length > 0) process.exit(1);
  console.log(`✓ ${MANIFESTS.length} manifests and the skills are valid and aligned.`);
}
