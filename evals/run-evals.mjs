// Runs the skills' evals.json against a real PocketBase instance on PocketBase Cloud, with Claude Code headless,
// once with this plugin and once without, and scores each turn (docs/skill-design/implementation.md, "Running evals").
//
//   PBC_TOKEN=<cli token> node evals/run-evals.mjs --instance <id> --project <id> [--skill change-schema]
//     [--case rename-keeps-data] [--runs 3] [--branches with,without] [--no-boundaries] [--model opus]
//
// The instance is reset before every case: each collection it did not have when the run began is deleted, then the
// case's fixture (evals/fixture.json) is created. Backups and hook files made during a case are removed after it. The
// collections it had at the start are compared at the end; a change there fails the run. Results go to
// evals/results/ (one CSV row per check, and a JSON file with every tool call).
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { connect } from "./mcp-client.mjs";
import { judgeVerdicts, scoreTurn } from "./score.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { values: opt } = parseArgs({
  options: {
    instance: { type: "string" },
    project: { type: "string" },
    skill: { type: "string", multiple: true },
    case: { type: "string", multiple: true },
    runs: { type: "string", default: "3" },
    branches: { type: "string", default: "with,without" },
    "no-boundaries": { type: "boolean", default: false },
    model: { type: "string", default: "opus" },
    "judge-model": { type: "string", default: "sonnet" },
    server: { type: "string", default: "https://mcp.pocketbasecloud.com/mcp" },
  },
});
const TOKEN = process.env.PBC_TOKEN;
if (!TOKEN || !opt.instance || !opt.project) {
  console.error("usage: PBC_TOKEN=… node evals/run-evals.mjs --instance <id> --project <id> [--skill <name>]");
  process.exit(2);
}
const RUNS = Number(opt.runs);
const BRANCHES = opt.branches.split(",");
/** Tools no eval needs and none may reach: they act outside the instance or can't be undone by the cleanup. */
const BLOCKED = [
  "create_pocketbase", "update_pocketbase_config", "set_continuous_backup", "create_project", "delete_record",
  "run_cron", "deploy_public", "add_domain", "verify_domain", "remove_domain", "set_env_vars", "delete_env_vars",
].map((t) => `mcp__pocketbasecloud__${t}`);
const FEATURES = "account,resources,deploy,database,docs";
const url = (extra) => `${opt.server}?project_ref=${opt.project}&features=${extra ?? FEATURES}`;

// ---- the instance: guard, reset, cleanup ----

const admin = await connect(url(`${FEATURES},database_admin`), TOKEN);
const target = await admin.call("get_resource", { kind: "pocketbase", resource: opt.instance });
if (target.project !== opt.project) throw new Error(`${opt.instance} is not in project ${opt.project}.`);
const R = target.id;
const isEval = (name) => name.startsWith("eval_");

async function userCollections() {
  const { collections } = await admin.call("list_collections", { resource: R });
  return collections.filter((c) => !c.system).map((c) => c.name);
}
async function snapshot(names) {
  const out = {};
  for (const n of names) {
    out[n] = {
      definition: await admin.call("get_collection", { resource: R, collection: n }),
      count: (await admin.call("count_records", { resource: R, collection: n })).total,
    };
  }
  return out;
}
async function recordIds(collection) {
  const ids = [];
  for (let page = 1; ; page++) {
    const r = await admin.call("list_records", { resource: R, collection, fields: "id", limit: 50, page });
    ids.push(...r.items.map((i) => i.id));
    if (!r.totalPages || page >= r.totalPages || page >= 40) return ids;
  }
}
const baseNames = (await userCollections()).filter((n) => !isEval(n));
const baseline = await snapshot(baseNames);
const baseRecords = Object.fromEntries(await Promise.all(baseNames.map(async (n) => [n, new Set(await recordIds(n))])));

/**
 * Puts the instance's own collections back as they were at the start: a run without the skill may change a rule or
 * add a field or a record anywhere. Fields it added are removed, the stored definition is applied again (get_collection
 * nests the rules; apply_collections takes them at the top), and records it added are deleted.
 */
async function restoreBaseline() {
  for (const n of baseNames) {
    const was = baseline[n].definition;
    const now = await admin.call("get_collection", { resource: R, collection: n });
    if (JSON.stringify(now) !== JSON.stringify(was)) {
      const kept = new Set(was.fields.map((f) => f.name));
      const added = now.fields.filter((f) => !kept.has(f.name) && !f.system).map((f) => f.name);
      if (added.length) await admin.call("remove_fields", { resource: R, collection: n, fields: added, backupFirst: false, confirm: true });
      const { rules, ...rest } = was;
      await admin.call("apply_collections", { resource: R, collections: [{ ...rest, ...rules }] });
      const again = await admin.call("get_collection", { resource: R, collection: n });
      console.log(JSON.stringify(again) === JSON.stringify(was) ? `  put ${n} back as it was` : `  ✗ ${n} could not be put back exactly`);
    }
    for (const id of await recordIds(n)) {
      if (!baseRecords[n].has(id)) await admin.call("delete_record", { resource: R, collection: n, id, confirm: true });
    }
  }
}
const baseBackups = new Set((await admin.call("list_backups", { resource: R })).backups.map((b) => b.key));
const baseHooks = new Set((await admin.call("list_hooks", { resource: R })).hooks.map((h) => h.filename));
const fixture = JSON.parse(readFileSync(join(ROOT, "evals/fixture.json"), "utf8"));
const base = `https://${target.domain}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Waits for the instance to answer again after a hook deploy restarts it. */
async function waitHealthy() {
  await sleep(3000);
  for (let i = 0; i < 60; i++) {
    const ok = await fetch(`${base}/api/health`).then((r) => r.ok, () => false);
    if (ok) return sleep(2000);
    await sleep(1000);
  }
  throw new Error(`${target.name} did not answer after the hook deploy.`);
}

/** Sends one fixture request to the instance, as a visitor or as a fixture member (`as`: "eval_members.1"). */
async function send(request, fill) {
  const headers = { "content-type": "application/json" };
  if (request.as) {
    const [collection, index] = request.as.split(".");
    const { email, password } = fixture.collections[collection].records[Number(index)];
    const auth = await fetch(`${base}/api/collections/${collection}/auth-with-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ identity: email, password }),
    }).then((r) => r.json());
    if (!auth.token) throw new Error(`Could not sign in as ${request.as}.`);
    headers.authorization = auth.token;
  }
  await fetch(`${base}${fill(request.path)}`, {
    method: request.method,
    headers,
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
}

async function reset(parts = []) {
  await restoreBaseline();
  // A collection another one relates to is refused until that one is gone, so a few passes clear any order.
  for (let pass = 0; pass < 6; pass++) {
    const extra = (await userCollections()).filter((n) => !baseNames.includes(n));
    if (extra.length === 0) break;
    for (const name of extra) {
      await admin
        .call("delete_collection", { resource: R, collection: name, confirmName: name, backupFirst: false, confirm: true })
        .catch(() => {});
    }
  }
  const left = (await userCollections()).filter((n) => !baseNames.includes(n));
  if (left.length) throw new Error(`Could not delete ${left.join(", ")}; check the instance by hand.`);
  // Collections with their records, then hooks, then traffic, whatever order the case lists them in.
  const ids = {};
  const fill = (v) =>
    typeof v === "string" ? v.replace(/\{(\w+)\.(\d+)\}/g, (all, c, i) => ids[c]?.[Number(i)] ?? all) : v;
  for (const part of parts.filter((p) => p in fixture.collections)) {
    const { definition, records } = fixture.collections[part];
    await admin.call("apply_collections", { resource: R, collections: [definition] });
    if (records?.length) {
      const rows = records.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fill(v)])));
      ids[part] = (await admin.call("create_records", { resource: R, collection: part, records: rows })).ids;
    }
  }
  const hooks = parts.filter((p) => p in (fixture.hooks ?? {}));
  if (hooks.length) {
    const files = hooks.map((h) => ({ filename: fixture.hooks[h].filename, content: fixture.hooks[h].content }));
    await admin.call("deploy_hooks", { resource: R, files });
    await waitHealthy();
  }
  const traffic = parts.filter((p) => p in (fixture.traffic ?? {}));
  for (const t of traffic) for (const request of fixture.traffic[t].requests) await send(request, fill);
  // PocketBase writes request log entries a few seconds after the request.
  if (traffic.length) await sleep(6000);
}

async function cleanup() {
  for (const b of (await admin.call("list_backups", { resource: R })).backups) {
    if (!baseBackups.has(b.key)) await admin.call("delete_backup", { resource: R, name: b.key, confirm: true });
  }
  for (const h of (await admin.call("list_hooks", { resource: R })).hooks) {
    if (baseHooks.has(h.filename)) continue;
    await run("pbc", ["pocketbase", "hooks", "rm", h.filename, "--name", target.name, "--project", opt.project, "--yes", "--no-input"], tmpdir(), 60_000);
    await waitHealthy();
  }
}

// ---- Claude Code, headless ----

function run(cmd, args, cwd, timeoutMs, onLine) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let buffered = "";
    child.stdout.on("data", (d) => {
      out += d;
      if (!onLine) return;
      buffered += d;
      const lines = buffered.split("\n");
      buffered = lines.pop();
      for (const l of lines) if (onLine(l) === "stop") child.kill();
    });
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out, err });
    });
  });
}

const configDir = mkdtempSync(join(tmpdir(), "pbc-evals-"));
const mcpConfig = (readOnly) => {
  const path = join(configDir, readOnly ? "mcp.ro.json" : "mcp.rw.json");
  const server = { type: "http", url: `${url()}${readOnly ? "&read_only=true" : ""}`, headers: { Authorization: "Bearer ${PBC_TOKEN}" } };
  writeFileSync(path, JSON.stringify({ mcpServers: { pocketbasecloud: server } }));
  return path;
};
const emptyConfig = join(configDir, "none.json");
writeFileSync(emptyConfig, JSON.stringify({ mcpServers: {} }));

const events = (out) =>
  out.split("\n").filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });

async function turn({ cwd, text, resume, plugin, readOnly, stopAtSkill }) {
  const args = [
    "-p", text, ...(resume ? ["--resume", resume] : []), "--output-format", "stream-json", "--verbose",
    "--model", opt.model, "--setting-sources", "project", ...(plugin ? ["--plugin-dir", ROOT] : []),
    "--mcp-config", mcpConfig(readOnly), "--strict-mcp-config",
    "--allowedTools", ...(plugin ? ["Skill"] : []), "Read", "Glob", "Grep", "mcp__pocketbasecloud",
    "--disallowedTools", ...(plugin ? [] : ["Skill"]), "Bash", "Write", "Edit", "NotebookEdit", "WebFetch", "WebSearch", "Agent", "Task", ...BLOCKED,
  ];
  // A boundary run stops at the first Skill call, or after three server calls without one: an agent may look up the
  // instance before it picks a skill.
  let serverCalls = 0;
  const stop = stopAtSkill
    ? (line) => {
        if (!/"type":"tool_use"/.test(line)) return undefined;
        if (/"name":"Skill"/.test(line)) return "stop";
        if (/"name":"mcp__/.test(line) && ++serverCalls >= 3) return "stop";
        return undefined;
      }
    : undefined;
  const { code, out } = await run("claude", args, cwd, 12 * 60_000, stop);
  const ev = events(out);
  const uses = ev.filter((e) => e.type === "assistant").flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === "tool_use"));
  const result = ev.find((e) => e.type === "result");
  return {
    ok: code === 0 && result && !result.is_error,
    session: ev.find((e) => e.type === "system" && e.subtype === "init")?.session_id,
    skills: uses.filter((u) => u.name === "Skill").map((u) => u.input?.skill),
    calls: uses.filter((u) => u.name.startsWith("mcp__")).map((u) => ({ tool: u.name.replace("mcp__pocketbasecloud__", ""), input: u.input })),
    answer: result?.result ?? "",
    cost: result?.total_cost_usd ?? 0,
  };
}

const judgePrompt = readFileSync(join(ROOT, "evals/judge.md"), "utf8");
async function judge(requirements, reply) {
  if (!requirements?.length) return { verdicts: [], cost: 0 };
  const text = `${judgePrompt}\nRequirements:\n${requirements.map((r) => `- ${r}`).join("\n")}\n\nReply:\n<<<\n${reply}\n>>>`;
  let answers = [];
  let cost = 0;
  let trouble = "";
  // A judge call that errors or times out now and then is asked again once, so a lost answer is not a fail.
  for (let attempt = 0; attempt < 2 && answers.length === 0; attempt++) {
    const cwd = mkdtempSync(join(tmpdir(), "pbc-judge-"));
    const { code, out } = await run("claude", ["-p", text, "--output-format", "json", "--model", opt["judge-model"], "--setting-sources", "project",
      "--mcp-config", emptyConfig, "--strict-mcp-config", "--no-session-persistence", "--tools", ""], cwd, 3 * 60_000);
    rmSync(cwd, { recursive: true, force: true });
    try {
      const res = JSON.parse(out);
      cost += res.total_cost_usd ?? 0;
      const body = String(res.result ?? "");
      answers = JSON.parse(body.slice(body.indexOf("["), body.lastIndexOf("]") + 1));
    } catch {
      trouble = `judge gave no readable answer (exit ${code}${out ? `, ${out.slice(-120)}` : ""})`;
    }
  }
  const verdicts = judgeVerdicts(requirements, answers, reply);
  if (answers.length === 0) for (const v of verdicts) v.detail = trouble;
  return { verdicts, cost };
}

/** Claude Code keeps each session under ~/.claude/projects/<cwd with non-alphanumerics as dashes>. */
function forget(cwd) {
  rmSync(cwd, { recursive: true, force: true });
  for (const dir of [cwd, `/private${cwd}`]) {
    const path = join(homedir(), ".claude/projects", dir.replace(/[^A-Za-z0-9]/g, "-"));
    if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  }
}

// ---- the cases ----

const instancePrompt = (p) => p.replaceAll("{instance}", target.name);
const skills = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "skills", d.name, "evals.json")))
  .map((d) => d.name)
  .filter((s) => !opt.skill || opt.skill.includes(s));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const resultsDir = join(ROOT, "evals/results");
mkdirSync(resultsDir, { recursive: true });
const csv = join(resultsDir, "results.csv");
if (!existsSync(csv)) appendFileSync(csv, "stamp,skill,case,branch,run,turn,check,item,pass,detail,cost_usd\n");
const q = (v) => `"${String(v).replaceAll('"', '""')}"`;
const detail = [];
let spent = 0;

function record(row, checks, cost) {
  for (const c of checks) {
    appendFileSync(csv, [stamp, row.skill, row.case, row.branch, row.run, row.turn, c.check, q(c.item), c.pass, q(c.detail ?? ""), cost.toFixed(4)].join(",") + "\n");
  }
}

for (const skill of skills) {
  const evals = JSON.parse(readFileSync(join(ROOT, "skills", skill, "evals.json"), "utf8"));
  for (const c of evals.cases.filter((x) => !opt.case || opt.case.includes(x.id))) {
    for (const branch of BRANCHES) {
      for (let n = 1; n <= RUNS; n++) {
        await reset(c.fixture);
        const cwd = mkdtempSync(join(tmpdir(), "pbc-eval-"));
        const readOnly = c.connection?.read_only === true;
        const row = { skill, case: c.id, branch, run: n };
        const first = await turn({ cwd, text: instancePrompt(c.prompt), plugin: branch === "with", readOnly });
        const turns = [["1", first, c]];
        if (c.approve && first.session) {
          turns.push(["2", await turn({ cwd, text: c.approve.reply, resume: first.session, plugin: branch === "with", readOnly }), c.approve]);
        }
        for (const [t, result, spec] of turns) {
          const checks = [{ check: "turn", item: "finished", pass: result.ok, detail: result.ok ? "" : "error or timeout" }];
          if (t === "1" && branch === "with") {
            checks.push({ check: "skill", item: skill, pass: result.skills[0] === `pocketbase-cloud:${skill}`, detail: result.skills[0] ?? "none" });
          }
          checks.push(...scoreTurn(result.calls, spec, { id: R, name: target.name }));
          const judged = await judge(spec.answer_must, result.answer);
          checks.push(...judged.verdicts);
          spent += result.cost + judged.cost;
          record({ ...row, turn: t }, checks, result.cost + judged.cost);
          detail.push({ ...row, turn: t, calls: result.calls, skills: result.skills, answer: result.answer, checks });
          const failed = checks.filter((x) => !x.pass);
          console.log(`${skill}/${c.id} ${branch} #${n} turn ${t}: ${failed.length ? `FAIL ${failed.map((x) => `${x.check}:${x.item}`).join("; ")}` : "pass"} ($${result.cost.toFixed(2)})`);
        }
        forget(cwd);
        await cleanup();
      }
    }
  }
  if (opt["no-boundaries"] || !BRANCHES.includes("with")) continue;
  for (const b of evals.boundaries ?? []) {
    for (let n = 1; n <= RUNS; n++) {
      const cwd = mkdtempSync(join(tmpdir(), "pbc-eval-"));
      const result = await turn({ cwd, text: instancePrompt(b.prompt), plugin: true, readOnly: true, stopAtSkill: true });
      forget(cwd);
      const first = result.skills[0]?.replace("pocketbase-cloud:", "");
      const checks = [{ check: "boundary", item: b.prompt, pass: first === b.expected_skill && !result.skills.some((s) => s?.endsWith(`:${b.should_not_trigger}`)), detail: first ?? "no skill" }];
      spent += result.cost;
      record({ skill, case: "boundary", branch: "with", run: n, turn: "1" }, checks, result.cost);
      detail.push({ skill, case: "boundary", prompt: b.prompt, run: n, skills: result.skills, checks });
      console.log(`${skill}/boundary #${n} "${b.prompt}": ${checks[0].pass ? "pass" : `FAIL (${checks[0].detail})`}`);
    }
  }
}

// ---- the end: leave the instance as it was, and say what passed ----

await reset();
await cleanup();
const after = await snapshot(baseNames);
const changed = baseNames.filter((n) => JSON.stringify(after[n]?.definition) !== JSON.stringify(baseline[n].definition));
// The app itself may write records meanwhile, so a count that moved is reported, not failed.
const recounted = baseNames.filter((n) => after[n]?.count !== baseline[n].count);
writeFileSync(join(resultsDir, `${stamp}.json`), JSON.stringify({ instance: target.name, model: opt.model, spent, detail }, null, 2));
rmSync(configDir, { recursive: true, force: true });

const groups = new Map();
for (const d of detail) {
  for (const c of d.checks) {
    const key = `${d.skill}/${d.case} ${d.branch ?? "with"} t${d.turn} ${c.check}:${c.item}`;
    const g = groups.get(key) ?? { pass: 0, all: 0 };
    g.all++;
    if (c.pass) g.pass++;
    groups.set(key, g);
  }
}
console.log("\nChecks (passes / runs):");
for (const [key, g] of groups) console.log(`${g.pass === g.all ? "✓" : "✗"} ${g.pass}/${g.all}  ${key}`);
console.log(`\nSpent about $${spent.toFixed(2)}. Rows: ${csv}`);
if (recounted.length) console.log(`Record counts moved in ${recounted.join(", ")}: the app or the evals wrote there.`);
if (changed.length) {
  console.error(`\n✗ The instance's own collections changed during the run: ${changed.join(", ")}. Check them by hand.`);
  process.exit(1);
}
