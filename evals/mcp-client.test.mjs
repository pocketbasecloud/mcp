import assert from "node:assert/strict";
import { test } from "node:test";
import { connect } from "./mcp-client.mjs";

/** A fake MCP endpoint: answers initialize, then each tools/call from the given queue. */
function fakeServer(answers) {
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const msg = JSON.parse(init.body);
    if (msg.method !== "tools/call") return new Response(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: {} }));
    calls.push(msg.params.name);
    const next = answers.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: next }));
  };
  return calls;
}
const ok = (data) => ({ structuredContent: data });
const toolError = (code) => ({ isError: true, structuredContent: { error: { code, message: "could not reach PocketBase Cloud" } } });

test("a safe tool is asked again after a network error, and its answer returned", async () => {
  const calls = fakeServer([new TypeError("fetch failed"), toolError("NETWORK_ERROR"), ok({ collections: [] })]);
  const c = await connect("https://x.test/mcp", "t", { retryDelayMs: 1 });
  assert.deepEqual(await c.call("list_collections", {}), { collections: [] });
  assert.deepEqual(calls, ["list_collections", "list_collections", "list_collections"]);
});

test("create_records is never asked again, so a fixture is not written twice", async () => {
  const calls = fakeServer([toolError("NETWORK_ERROR"), ok({ created: 1 })]);
  const c = await connect("https://x.test/mcp", "t", { retryDelayMs: 1 });
  await assert.rejects(c.call("create_records", {}), /NETWORK_ERROR/);
  assert.deepEqual(calls, ["create_records"]);
});

test("an error that is not about the network is not retried", async () => {
  const calls = fakeServer([toolError("NOT_FOUND"), ok({})]);
  const c = await connect("https://x.test/mcp", "t", { retryDelayMs: 1 });
  await assert.rejects(c.call("get_collection", {}), /NOT_FOUND/);
  assert.deepEqual(calls, ["get_collection"]);
});
