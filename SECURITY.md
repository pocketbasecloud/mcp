# Security policy

Thanks for helping keep the PocketBase Cloud MCP Server and the people who use it safe.

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security problem.** Public issues are visible to everyone and can
put users at risk before a fix is ready.

Report it privately instead, through GitHub's
[private vulnerability reporting](https://github.com/pocketbasecloud/mcp/security/advisories/new) for this
repository. Only the maintainers see it.

A good report usually includes:

- What you found, and why you think it's a security issue
- Steps to reproduce, or a proof of concept
- The affected component (a file in this repo, a client manifest, or the hosted endpoint)
- The impact you think it could have

## What this repository covers

This repo holds the public pieces of the PocketBase Cloud MCP Server: the documentation, the client manifests
(`.mcp.json`, `mcp.json` and the Claude, Cursor, Gemini and Agent Plugins manifests), the MCP Registry entry
(`server.json`), and the [skills](skills/).

The server itself is a hosted service at `mcp.pocketbasecloud.com`. Report issues in the hosted service, in sign-in,
or in PocketBase Cloud the same way. We maintain and update the hosted server, so there's nothing for you to patch
on your end: connect to the endpoint documented in the [README](README.md).

## Using the MCP server safely

MCP lets an AI agent act in your PocketBase Cloud account with the access you approved. That's useful, and it
carries real risk. Language models can be tricked by
[prompt injection](https://owasp.org/www-community/attacks/PromptInjection) and tool poisoning, where hidden
instructions, for example inside a record or a log line, push an agent to leak data or make changes you never asked
for.

A few habits that lower the risk:

- Connect only MCP clients you trust.
- Use least privilege: choose **read only** and a **single project** when you connect, unless you need more.
- Read what the assistant is about to change before you approve it, especially deletes and restores.
- Disconnect apps you no longer use; unused connections end after 30 days.

## Coordinated disclosure

Please give us a fair chance to investigate and ship a fix before you share details publicly. We're grateful to the
researchers who report responsibly and work with us on timing.
