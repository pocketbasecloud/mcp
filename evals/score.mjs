// Scores one turn of an eval case from the tool calls it made, and turns the judge's answer into verdicts.
import { ALL_WRITES, WRITE_TOOLS } from "../scripts/validate.mjs";

const WRITES = new Set(WRITE_TOOLS);

/** The tools a must_not_call list names, with "@write" standing for every write tool. */
export const expandTools = (tools) => [...new Set(tools.flatMap((t) => (t === ALL_WRITES ? WRITE_TOOLS : [t])))];

/**
 * Every check of a turn as { check, item, pass, detail }. calls: [{ tool, input }] in order, tool names without the
 * mcp__pocketbasecloud__ prefix. target: { id, name } of the eval instance; a write aimed anywhere else always fails.
 */
export function scoreTurn(calls, spec, target) {
  const tools = calls.map((c) => c.tool);
  const first = (tool) => tools.indexOf(tool);
  const checks = [];
  for (const tool of spec.must_call ?? []) {
    checks.push({ check: "must_call", item: tool, pass: tools.includes(tool), detail: "" });
  }
  for (const [a, b] of spec.must_call_before ?? []) {
    const pass = first(a) !== -1 && first(b) !== -1 && first(a) < first(b);
    const detail = first(a) === -1 ? `${a} not called` : first(b) === -1 ? `${b} not called` : pass ? "" : `${b} came first`;
    checks.push({ check: "must_call_before", item: `${a}<${b}`, pass, detail });
  }
  for (const [tool, text] of spec.must_call_matching ?? []) {
    const pass = calls.some((c) => c.tool === tool && JSON.stringify(c.input ?? {}).includes(JSON.stringify(text).slice(1, -1)));
    checks.push({ check: "must_call_matching", item: `${tool}~${text}`, pass, detail: pass ? "" : `no ${tool} call with it` });
  }
  for (const tool of expandTools(spec.must_not_call ?? [])) {
    if (tools.includes(tool)) checks.push({ check: "must_not_call", item: tool, pass: false, detail: "called" });
  }
  if ((spec.must_not_call ?? []).length > 0 && !checks.some((c) => c.check === "must_not_call")) {
    checks.push({ check: "must_not_call", item: "all", pass: true, detail: "" });
  }
  for (const c of calls) {
    const resource = c.input?.resource;
    if (WRITES.has(c.tool) && resource !== undefined && resource !== target.id && resource !== target.name) {
      checks.push({ check: "target", item: c.tool, pass: false, detail: `aimed at ${resource}` });
    }
  }
  return checks;
}

const squash = (s) => s.toLowerCase().replace(/[`*_]/g, "").replace(/\s+/g, " ").trim();

/**
 * One verdict per answer_must string. A pass needs the judge to say pass and to quote text that is really in the
 * reply, so a judge that invents a quote fails the requirement.
 */
export function judgeVerdicts(requirements, answers, reply) {
  const text = squash(reply);
  return requirements.map((requirement, i) => {
    const a = answers.find((x) => x.requirement === requirement) ?? answers[i];
    const quote = typeof a?.quote === "string" ? a.quote : "";
    const quoted = quote.trim() !== "" && text.includes(squash(quote));
    const pass = a?.verdict === "pass" && quoted;
    const detail = !a ? "no verdict" : a.verdict !== "pass" ? "judged fail" : quoted ? "" : "quote not in the reply";
    return { check: "answer_must", item: requirement, pass, detail, quote };
  });
}
