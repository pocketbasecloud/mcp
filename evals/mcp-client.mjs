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

export async function connect(url, token) {
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
    /** Calls a tool and returns its data; a tool error throws with the server's code and message. */
    async call(name, args = {}) {
      const result = await rpc("tools/call", { name, arguments: args });
      const data = resultData(result);
      if (result.isError || data?.error) {
        throw new Error(`${name}: ${data?.error?.code ?? "ERROR"} ${data?.error?.message ?? JSON.stringify(data).slice(0, 300)}`);
      }
      return data;
    },
  };
}
