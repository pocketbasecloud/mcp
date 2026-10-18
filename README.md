<p align="center">
  <img src="assets/logo.svg" alt="PocketBase Cloud" width="96" height="96">
</p>

<h1 align="center">PocketBase Cloud MCP Server</h1>

<p align="center">
  <b>The official Model Context Protocol (MCP) server for PocketBase Cloud: a hosted bridge that lets your AI assistant work in your PocketBase Cloud account — projects, PocketBase instances, frontends and backends, deploys and logs, custom domains, and the collections and records inside each instance.</b>
</p>

<p align="center">
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/Model_Context_Protocol-compatible-000000?logo=modelcontextprotocol&logoColor=white" alt="Model Context Protocol compatible"></a>
  <a href="server.json"><img src="https://img.shields.io/badge/MCP_Registry-com.pocketbasecloud-000000?logo=modelcontextprotocol&logoColor=white" alt="MCP Registry: com.pocketbasecloud"></a>
  <a href="#how-it-works"><img src="https://img.shields.io/badge/Auth-OAuth_2.1%20%7C%20CLI%20token-2EBC4F" alt="Auth: OAuth 2.1 or CLI token"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-F04E23" alt="License: Apache 2.0"></a>
</p>

<p align="center">
  <a href="https://mcp.pocketbasecloud.com/"><b>Connect page</b></a> ·
  <a href="#tools"><b>Tools</b></a> ·
  <a href="#data-and-security"><b>Data and security</b></a> ·
  <a href="https://pocketbasecloud.com"><b>PocketBase Cloud</b></a>
</p>

---

**PocketBase Cloud** hosts PocketBase backends, frontends and server apps. Connect your account once, then ask your
assistant in plain words; it picks and runs the right actions.

With the PocketBase Cloud MCP Server, your assistant can:

* **See what is running:** projects, PocketBase instances, frontends and backends with their status, recent
  deploys, and the logs of instances and backends.
* **Find out why something broke:** read a failed deploy's build log and explain the fix.
* **Start an app:** create projects and PocketBase instances in the region you choose.
* **Ship:** add and verify custom domains, deploy hooks and static sites, and get the exact `pbc` command to deploy
  your source code.
* **Work with data:** design collections and API rules, and read, create, update and delete records.
* **Harden an instance:** review API rules for security gaps, find slow requests, and back up before risky
  changes.

> [!IMPORTANT]
> **You choose the access when you connect:** read and write or read only, and all projects or a single one.
> [Options](#options) in the server URL can narrow a connection, never widen it. Deleting needs your explicit
> approval of that exact change.

## One-click setup

Pick your AI client below. Each button uses your client's native install link, so you don't need to edit any JSON
config by hand.

<table align="center">
  <tr>
    <td align="center" width="200">
      <a href="https://cursor.com/en/install-mcp?name=pocketbasecloud&config=eyJ1cmwiOiJodHRwczovL21jcC5wb2NrZXRiYXNlY2xvdWQuY29tL21jcCJ9">
        <img src="https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white" alt="Add to Cursor"><br>
        <b>Add to Cursor</b>
      </a>
      <br><sub>Build on PocketBase from your editor.</sub>
    </td>
    <td align="center" width="200">
      <a href="https://vscode.dev/redirect/mcp/install?name=pocketbasecloud&config=%7B%22url%22%3A%22https%3A%2F%2Fmcp.pocketbasecloud.com%2Fmcp%22%2C%22type%22%3A%22http%22%7D">
        <img src="https://img.shields.io/badge/VS_Code-0098FF?style=for-the-badge&logoColor=white" alt="Add to VS Code"><br>
        <b>Add to VS Code</b>
      </a>
      <br><sub>Use it from GitHub Copilot.</sub>
    </td>
    <td align="center" width="200">
      <a href="#claude-and-chatgpt">
        <img src="https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=claude&logoColor=white" alt="Add to Claude"><br>
        <b>Add to Claude</b>
      </a>
      <br><sub>Add it as a custom connector.</sub>
    </td>
    <td align="center" width="200">
      <a href="#claude-and-chatgpt">
        <img src="https://img.shields.io/badge/ChatGPT-10A37F?style=for-the-badge&logoColor=white" alt="Add to ChatGPT"><br>
        <b>Add to ChatGPT</b>
      </a>
      <br><sub>Add it as a custom MCP server.</sub>
    </td>
  </tr>
</table>

The server URL, for any other client:

```
https://mcp.pocketbasecloud.com/mcp
```

Paste it exactly: the address ends in `/mcp`.

### Let your agent do the setup

Most AI coding agents can add the server and start sign-in themselves. Paste this into your agent:

```
Add the PocketBase Cloud MCP server https://mcp.pocketbasecloud.com/mcp to this agent
(remote, Streamable HTTP, OAuth), following https://mcp.pocketbasecloud.com/.
Then start the authentication flow so I can sign in to PocketBase Cloud.
```

### Claude and ChatGPT

**Claude (claude.ai and Claude Desktop), with the plugin.** On a paid plan, the plugin brings the skills too:

1. **Customize → Plugins**, then **Add → Add marketplace**, and enter `pocketbasecloud/mcp`.
2. Install **PocketBase Cloud**.
3. Open the plugin's **Connectors** tab and connect `pocketbasecloud`: sign in to PocketBase Cloud, then choose the
   access and the project. Installing alone does not connect it.

A plugin added there is saved to your Claude account, so Claude Code has it too when you sign in with the same
account.

**Claude (claude.ai and Claude Desktop), server only**

1. **Customize → Connectors**, then **+ Add → Add custom connector**.
2. Name it (for example *PocketBase Cloud*), paste the server URL, and continue. If asked how Claude identifies
   itself, choose **Register automatically**. Click **Add**.
3. Click **Connect**, sign in to PocketBase Cloud, then choose the access and the project.

On a Team or Enterprise plan, an owner adds it once under **Organization settings → Connectors → Add → Custom →
Web**; then each member clicks **Connect**.

**ChatGPT**

1. **Plugins → + → Add custom MCP server.**
2. Name it, enter the server URL under **Connection** with **OAuth** authentication, accept the warning about
   custom servers, then **Create as a plugin**.
3. Install the plugin, sign in to PocketBase Cloud when ChatGPT asks, then type `@` in a chat to use it.

### Other clients

| Client | Command or configuration |
| --- | --- |
| Claude Code | `claude mcp add --transport http pocketbasecloud https://mcp.pocketbasecloud.com/mcp`, then run `/mcp` in a session to sign in |
| Claude Code (plugin, with skills) | `/plugin marketplace add pocketbasecloud/mcp`, then `/plugin install pocketbase-cloud@pocketbase-cloud` |
| Cline | MCP Servers → Remote Servers → Edit Configuration, and add `"pocketbasecloud": { "type": "streamableHttp", "url": "https://mcp.pocketbasecloud.com/mcp" }` under `mcpServers`. Sign in when Cline opens the browser. See [`llms-install.md`](llms-install.md) |
| Codex | `codex mcp add pocketbasecloud --url https://mcp.pocketbasecloud.com/mcp`, then `codex mcp login pocketbasecloud` |
| Cursor | The **Add to Cursor** button above, or `"pocketbasecloud": { "url": "https://mcp.pocketbasecloud.com/mcp" }` under `mcpServers` in `.cursor/mcp.json` |
| Cursor (plugin, with skills) | **PocketBase Cloud** in the Cursor Marketplace once it is listed. Until then, copy this repository (a copy, not a symlink) into `~/.cursor/plugins/local/pocketbase-cloud` and reload Cursor. Keep only one PocketBase Cloud server: remove the one in `.cursor/mcp.json` if you added it |
| VS Code / GitHub Copilot | The **Add to VS Code** button above, or `"pocketbasecloud": { "type": "http", "url": "https://mcp.pocketbasecloud.com/mcp" }` under `servers` in `.vscode/mcp.json` |
| Devin Desktop (formerly Windsurf) | In the Cascade panel, **… → Open MCP config file**, and add `"pocketbasecloud": { "url": "https://mcp.pocketbasecloud.com/mcp" }` under `mcpServers`. For the Devin agent: `devin mcp add pocketbasecloud https://mcp.pocketbasecloud.com/mcp`, then `devin mcp login pocketbasecloud` |
| Gemini CLI | `gemini extensions install https://github.com/pocketbasecloud/mcp`, then `/mcp auth pocketbasecloud` |
| Any other MCP client | The server URL, with the Streamable HTTP transport and OAuth |

**Scripts and CI:** instead of signing in, send a PocketBase Cloud CLI access token (portal → Account → CLI access
token) as `Authorization: Bearer <token>`. See [How it works](#how-it-works).

## Contents

* [One-click setup](#one-click-setup)
* [Plugin packaging and compatibility](#plugin-packaging-and-compatibility)
* [Tools](#tools)
* [Options](#options)
* [Before you start](#before-you-start)
* [Data and security](#data-and-security)
* [How it works](#how-it-works)
* [Example prompts](#example-prompts)
* [Skills](#skills)
* [Troubleshooting](#troubleshooting)
* [Security](#security)
* [Support and feedback](#support-and-feedback)
* [Disclaimer](#disclaimer)

---

## Plugin packaging and compatibility

This repository publishes the same MCP server and skills in several package formats, so each client can use its
native discovery and installation flow:

| Format | Manifest and configuration | Shared components |
| --- | --- | --- |
| [Agent Plugins v1](https://agent-plugins.org/) | [`plugin.json`](plugin.json) and [`mcp.json`](mcp.json) | [`skills/`](skills/) |
| Claude plugin (Claude Code, claude.ai, Claude Desktop) | [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) and [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | [`.mcp.json`](.mcp.json) and [`skills/`](skills/) |
| Cursor plugin | [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json) | [`.mcp.json`](.mcp.json) and [`skills/`](skills/) |
| Gemini CLI extension | [`gemini-extension.json`](gemini-extension.json) | MCP server configuration embedded in the manifest, and [`skills/`](skills/), which Gemini CLI loads from the extension |
| MCP Registry | [`server.json`](server.json) | Remote server metadata |

Both `mcp.json` and `.mcp.json` are intentional: Agent Plugins requires the root `mcp.json` and its portable
transport vocabulary (`streamable-http`), while Claude and Cursor read `.mcp.json` with theirs (`http`). Gemini
CLI names the Streamable HTTP endpoint `httpUrl`. Keep the endpoint the same in all of them; `npm run validate`
checks it.

## Tools

The server groups its tools. Groups marked *opt-in* are added with the [`features`](#options) option. The live
list, with every tool, is on the [connect page](https://mcp.pocketbasecloud.com/).

| Group | Default | What it covers |
| --- | :---: | --- |
| `account` | ✅ | Overview of the account, plan and Free trial, projects, regions; create a project. |
| `resources` | ✅ | PocketBase instances, frontends and backends: list, inspect, create an instance, runtime settings, continuous backup. |
| `deploy` | ✅ | Deploys and their build logs, runtime logs, a one-call diagnosis, hooks, static sites, and the `pbc` command to deploy source code. |
| `domains` | ✅ | Add, verify, check and remove custom domains. |
| `docs` | ✅ | Search the PocketBase and PocketBase Cloud guide for agents. |
| `database` | ✅ | Inside an instance: collections, API rules, records, request logs, backups, crons, security and performance checks, TypeScript types. |
| `env` | opt-in | Environment variables of a resource (build-time for frontends); values are never read back. |
| `database_admin` | opt-in | Bulk deletes and restores: truncate or delete a collection, remove fields, restore or delete a backup. |

Not available on purpose: deleting projects or resources (use the portal or `pbc`), and building source code on
the server (it runs on your machine; the server gives you the `pbc` command).

## Options

Add these to the server URL's query string. They can narrow what you approved when signing in, never widen it.

| Option | Default | Effect |
| --- | --- | --- |
| `read_only` | `false` | Only tools that read. |
| `project_ref` | none | Limit every tool to one project. |
| `features` | `account,resources,deploy,domains,database,docs` | The tool groups. Add `env` for environment variables, `database_admin` for bulk deletes and restores. |

For example: `https://mcp.pocketbasecloud.com/mcp?read_only=true&project_ref=<project id>`.

## Before you start

### Prerequisites

* A **PocketBase Cloud account**. You sign in on the PocketBase Cloud portal when you connect.
* What you can create and deploy depends on your **plan**; new accounts start with a Free trial.
* Deploying **source code** also needs the PocketBase Cloud CLI, `pbc`, on your machine; the server tells you the
  exact command to run.
* An MCP client that supports remote servers (Streamable HTTP) and OAuth. For Claude, adding a custom connector
  needs a plan that allows it.

## Data and security

* **Your PocketBase Cloud session stays on the server.** Signing in stores the connection you approved, with your
  PocketBase Cloud session encrypted inside it. Your assistant gets its own token, valid for an hour and refreshed
  automatically; it never sees your PocketBase Cloud credentials.
* **Connections end when unused.** Remove the app in your assistant to disconnect; a connection is deleted after
  30 days without use.
* **No copies of your data.** The server never stores records, files or logs from your instances; it passes them
  to your assistant and forgets them.
* **Minimal telemetry.** For reliability it records each tool call (the tool, its target, the outcome, a shortened
  error and the duration) with a pseudonymous ID, and deletes those records after 90 days. It never records what
  you asked.
* **Guardrails on changes.** Tools that delete or restore need explicit confirmation (`confirm: true`); deleting a
  collection also needs its name typed again; bulk deletes and restores back the instance up first and return the
  backup's name. Restoring it brings records back, but not a deleted collection or field: instances replay that
  change when they restart, so restore the backup into a new instance instead. Changing the type of an existing field
  is refused.
* **Instance credentials are never held.** Database tools reach an instance through PocketBase Cloud, and only the
  calls those tools make are allowed: no instance settings, no backup downloads, no writes to system collections
  such as `_superusers`.
* **Untrusted content is fenced.** Records and logs come back inside `<untrusted-data-…>` tags, so the model treats
  them as data, not instructions.

See the [privacy policy](https://pocketbasecloud.com/privacy) and [terms](https://pocketbasecloud.com/terms).

## How it works

```
Your AI client ──Streamable HTTP──▶ mcp.pocketbasecloud.com/mcp ──▶ PocketBase Cloud API
                                                                 └─▶ your PocketBase instances (through PocketBase Cloud)
```

### Sign-in (OAuth 2.1)

The server supports OAuth 2.1 with dynamic client registration. When your client connects, it opens the PocketBase
Cloud portal, where you sign in as usual and choose the access (read and write, or read only) and the projects
(all, or one). Each token refresh renews the connection, so it stays valid while you use it.

### CLI token (scripts and CI)

For automation, send a PocketBase Cloud CLI access token directly:

```sh
claude mcp add --transport http pocketbasecloud \
  "https://mcp.pocketbasecloud.com/mcp?project_ref=<project id>&read_only=true" \
  --header "Authorization: Bearer <token>"
```

This forwards your token to PocketBase Cloud as is (token passthrough); interactive clients should use OAuth.

## Example prompts

* "What's running in my PocketBase Cloud account right now?"
* "Why did the last deploy of my frontend fail?"
* "Create a new PocketBase instance called `shop-db` in my Demo shop project."
* "Add the domain `api.example.com` to my backend and tell me which DNS record to create."
* "Give me the command to deploy this folder as a new backend."
* "Check the API rules of `shop-db` for security problems."
* "In `shop-db`, how many orders are paid, pending and refunded? Then show me the five newest."
* "Set up user accounts in `shop-db` so each user only sees their own orders."

## Skills

[`skills/`](skills/) holds workflows that every plugin in this repository installs:

| Skill | Use it for |
| --- | --- |
| [`getting-started`](skills/getting-started/SKILL.md) | A first project and PocketBase instance. |
| [`debug-deploy`](skills/debug-deploy/SKILL.md) | Why a deploy failed, and the command to deploy again. |
| [`review-security`](skills/review-security/SKILL.md) | API rules that are too open, fixed with your approval. |
| [`setup-user-accounts`](skills/setup-user-accounts/SKILL.md) | Users, per-user collections and safe rules. |
| [`design-collections`](skills/design-collections/SKILL.md) | An app's collections, relations, indexes and rules. |
| [`change-schema`](skills/change-schema/SKILL.md) | Changing fields that already hold data, without losing records. |
| [`investigate-errors`](skills/investigate-errors/SKILL.md) | Why the app gets errors or empty lists, and the fix. |
| [`launch-checklist`](skills/launch-checklist/SKILL.md) | A read-only, scored check before going live. |
| [`write-hooks`](skills/write-hooks/SKILL.md) | Server code in `pb_hooks`, read first and deployed with approval. |
| [`ship-app`](skills/ship-app/SKILL.md) | A site online from `pb_public` or a frontend, sent whole. |
| [`import-data`](skills/import-data/SKILL.md) | Rows from CSV or JSON, checked and imported with approval. |

With a plain MCP setup (no plugin), copy a skill's folder into your client's skills directory, or ask your
assistant to read the `SKILL.md`.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| "There was a problem connecting" | Check the URL ends in `/mcp`: `https://mcp.pocketbasecloud.com/mcp`. |
| The tools don't appear | Finish the PocketBase Cloud sign-in, and enable the connector for the chat. If needed, remove and add it again. |
| Only reading tools appear | The connection is read-only, from the sign-in choice or `read_only=true`. Reconnect and choose read and write. |
| Only one project is visible | The connection is limited to one project. Reconnect and choose all projects, or drop `project_ref`. |
| Database tools are missing | They come with the `database` group, which is on by default; check that `features` in the URL still includes it. |
| Asked to sign in again | A connection unused for 30 days ends; sign in again. |
| Cursor sign-in fails with "Invalid redirect URI" | Update Cursor. Current versions sign in through `http://localhost`; older ones used a `cursor://` callback, which the server doesn't accept. |
| Claude asks how it identifies itself | Choose **Register automatically**. |

## Security

Found a security issue? Please don't open a public issue; see [SECURITY.md](SECURITY.md).

## Support and feedback

* **Bugs and ideas:** [open an issue](https://github.com/pocketbasecloud/mcp/issues/new/choose).
* **Account, billing and platform questions:** [PocketBase Cloud](https://pocketbasecloud.com).
* **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

PocketBase Cloud is independent of the [PocketBase](https://pocketbase.io) open source project. The server is a
hosted service at `mcp.pocketbasecloud.com`; this repository holds its documentation, client manifests, MCP
Registry entry and skills, not the server's code. Tool names and behavior may change as the service evolves; the
live list is on the [connect page](https://mcp.pocketbasecloud.com/).
