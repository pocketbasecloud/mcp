// A minimal MCP client over streamable HTTP, enough for the eval runner to set up and clean up its fixture with the
// server's own tools. Answers come as JSON or as server-sent events; both are read.

/** Data of a tool result: its structured content, or the JSON inside the untrusted-data fence a record tool uses. */
function resultData(result) {
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.[0]?.text ?? "";
  const fenced = /<(untrusted-data-[\w-]+)>\n([\s\S]*)\n<\/\1>/.exec(text)?.[2];
  try {
    return JSON.parse(fenced ?? text);
  } catch {
    return { text };
  }
}

/** Tools a call may repeat after a network error: reads, and writes that end in the same state when sent twice. */
const SAFE_TO_REPEAT = new Set([
  "list_collections", "get_collection", "count_records", "list_records", "list_backups", "list_hooks", "get_hook",
  "get_resource", "apply_collections", "delete_collection", "remove_fields", "delete_record", "delete_backup",
  "deploy_hooks",
]);
/** An error a restarting instance or a dropped connection gives, which can pass on its own. */
const PASSING = /NETWORK_ERROR|PLATFORM_ERROR|ECONNRESET|fetch failed|socket|HTTP 50[234]/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function connect(url, token, { retryDelayMs = 2000 } = {}) {
  let session;
  let id = 0;
  async function rpc(method, params, notification = false) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${token}`,
        ...(session ? { "mcp-session-id": session } : {}),
      },
      body: JSON.stringify(notification ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: ++id, method, params }),
    });
    session ??= res.headers.get("mcp-session-id") ?? undefined;
    if (notification) return undefined;
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
    const text = await res.text();
    const messages = (res.headers.get("content-type") ?? "").includes("text/event-stream")
      ? text.split("\n").filter((l) => l.startsWith("data:")).map((l) => JSON.parse(l.slice(5)))
      : [JSON.parse(text)];
    const msg = messages.find((m) => m.id === id) ?? messages.at(-1);
    if (msg?.error) throw new Error(`${method}: ${msg.error.message}`);
    return msg?.result;
  }
  await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "pbc-evals", version: "1.0.0" } });
  await rpc("notifications/initialized", {}, true);
  return {
    /**
     * Calls a tool and returns its data; a tool error throws with the server's code and message. A tool that is safe
     * to repeat is asked again, up to four times with a growing wait, while the error is one that passes on its own.
     */
    async call(name, args = {}) {
      for (let attempt = 0; ; attempt++) {
        try {
          const result = await rpc("tools/call", { name, arguments: args });
          const data = resultData(result);
          if (result.isError || data?.error) {
            throw new Error(`${name}: ${data?.error?.code ?? "ERROR"} ${data?.error?.message ?? JSON.stringify(data).slice(0, 300)}`);
          }
          return data;
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (attempt >= 4 || !SAFE_TO_REPEAT.has(name) || !PASSING.test(message)) throw e;
          await sleep(retryDelayMs * 2 ** attempt);
        }
      }
    },
  };
}
