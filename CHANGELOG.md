# Changelog

Versions of this repository: the client manifests, the MCP Registry entry and the skills. The server itself
(`https://mcp.pocketbasecloud.com/mcp`) is deployed separately and changes without a version here. Each version is a
`v*` tag, published to the MCP Registry as `com.pocketbasecloud/mcp`.

## Unreleased

- Cline: `llms-install.md`, a Cline row in the README, and a 400 × 400 PNG logo for its marketplace.
- Repository hardening: GitHub Actions pinned to commit SHAs, Dependabot for Actions, and the Registry key kept in a
  `mcp-registry` environment that only `v*` tags can use.

## 1.4.3 (2026-10-18)

- Anthropic's directory fields in `.claude-plugin/plugin.json`: `icon`, `documentationUrl`, `supportUrl`,
  `privacyPolicyUrl`, `termsOfServiceUrl`.
- Cursor's `displayName`, `category` and `tags`, and `icons` in `server.json`.
- Install steps for claude.ai, Claude Desktop and Cursor plugins. Gemini CLI loads the skills too.
- Skill references that resolve: the `rules.md` copies no longer name a file their skill lacks, and change-schema links
  its `rules.md`.

## 1.4.2 (2026-10-18)

- review-security proposes create and update rules that keep a record's owner from changing.
- design-collections ends a read-only reply with the collection JSON and the migration file. launch-checklist says
  how a fix gets applied after reconnecting with write access.

## 1.4.1 (2026-10-18)

- ship-app is back, with its five evals.
- The skills spell out what Sonnet left out: each read-only hand-over in its own code block, a Tool column in the
  launch report, and the whole hook file as it will be deployed.
- review-security also loads for "who can delete X?".
- Evals for getting-started, debug-deploy, review-security and setup-user-accounts.

## 1.4.0 (2026-10-17)

- New skill: import-data (CSV or JSON rows into a collection, shown first and written after approval).
- Eval candidates, to test whether a skill is needed before writing it.

## 1.3.0 (2026-10-17)

- New skill: write-hooks (server code in `pb_hooks`, read before it is replaced, deployed after approval).
- ship-app was written, evaluated and dropped: the `deploy_public` tool already did what it taught.

## 1.2.0 (2026-10-17)

- New skills: design-collections, change-schema, investigate-errors, launch-checklist.
- An eval runner (`evals/`) that runs each skill's cases with and without the plugin.

## 1.1.0 (2026-10-15)

- The database tools are live. New skills: review-security, setup-user-accounts.

## 1.0.0 (2026-10-15)

- First release: client manifests (Agent Plugins, Claude Code, Cursor, Gemini CLI), the MCP Registry entry, and the
  skills getting-started and debug-deploy.
