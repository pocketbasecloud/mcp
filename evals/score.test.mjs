import assert from "node:assert/strict";
import { test } from "node:test";
import { judgeVerdicts, scoreTurn } from "./score.mjs";

const call = (tool, input = {}) => ({ tool, input });
const target = { id: "5tkmycouxbysbz4", name: "syntro-pocketbase" };
const failed = (checks) => checks.filter((c) => !c.pass).map((c) => `${c.check}:${c.item}`);

test("a turn that calls what it must, in order, and nothing it must not, passes", () => {
  const calls = [call("get_collection"), call("create_backup", { resource: "syntro-pocketbase" }), call("apply_collections", { resource: "5tkmycouxbysbz4" })];
  const checks = scoreTurn(calls, {
    must_call: ["get_collection"],
    must_call_before: [["create_backup", "apply_collections"]],
    must_not_call: ["remove_fields"],
  }, target);
  assert.deepEqual(failed(checks), []);
});

test("@write in must_not_call forbids every write tool", () => {
  const checks = scoreTurn([call("list_records"), call("upsert_records", { resource: "syntro-pocketbase" })], { must_not_call: ["@write"] }, target);
  assert.deepEqual(failed(checks), ["must_not_call:upsert_records"]);
});

test("a pair whose second tool runs first, or whose first never runs, fails must_call_before", () => {
  const swapped = scoreTurn([call("apply_collections", { resource: "syntro-pocketbase" }), call("create_backup", { resource: "syntro-pocketbase" })], { must_call_before: [["create_backup", "apply_collections"]] }, target);
  assert.deepEqual(failed(swapped), ["must_call_before:create_backup<apply_collections"]);
  const missing = scoreTurn([call("apply_collections", { resource: "syntro-pocketbase" })], { must_call_before: [["create_backup", "apply_collections"]] }, target);
  assert.deepEqual(failed(missing), ["must_call_before:create_backup<apply_collections"]);
});

test("a write aimed at another instance fails, whatever the case allows", () => {
  const checks = scoreTurn([call("apply_collections", { resource: "trace-mcp" })], {}, target);
  assert.deepEqual(failed(checks), ["target:apply_collections"]);
});

test("a missing must_call fails", () => {
  assert.deepEqual(failed(scoreTurn([], { must_call: ["get_collection"] }, target)), ["must_call:get_collection"]);
});

test("a judge's pass counts only with a quote found in the reply", () => {
  const reply = "I renamed the field.\nThe backup is called before-rename.zip, and all 12 records kept their values.";
  const verdicts = judgeVerdicts(
    ["names the backup", "says which hooks must change", "checks the count"],
    [
      { requirement: "names the backup", verdict: "pass", quote: "The backup is called before-rename.zip" },
      { requirement: "says which hooks must change", verdict: "pass", quote: "I updated your hooks." },
      { requirement: "checks the count", verdict: "pass", quote: "" },
    ],
    reply,
  );
  assert.deepEqual(verdicts.map((v) => v.pass), [true, false, false]);
});

test("a requirement the judge left out fails", () => {
  const verdicts = judgeVerdicts(["names the backup"], [], "anything");
  assert.equal(verdicts[0].pass, false);
});

test("must_call_matching needs a call of that tool whose arguments hold the text", () => {
  const calls = [call("get_request_logs", { filter: "data.status >= 500" }), call("get_request_logs", { filter: "level >= 8 && data.auth != '_superusers'" })];
  assert.deepEqual(failed(scoreTurn(calls, { must_call_matching: [["get_request_logs", "level >= 8"]] }, target)), []);
  assert.deepEqual(failed(scoreTurn(calls.slice(0, 1), { must_call_matching: [["get_request_logs", "level >= 8"]] }, target)), [
    "must_call_matching:get_request_logs~level >= 8",
  ]);
});
