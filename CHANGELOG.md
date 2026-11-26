# Changelog

Versions of this repository: the client manifests, the MCP Registry entry and the skills. The server itself
(`https://mcp.pocketbasecloud.com/mcp`) is deployed separately and changes without a version here. Each version is a
`v*` tag, published to the MCP Registry as `com.pocketbasecloud/mcp`.

## Unreleased

- Cline: `llms-install.md`, a Cline row in the README, and a 400 × 400 PNG logo for its marketplace.
- Repository hardening: GitHub Actions pinned to commit SHAs, Dependabot for Actions, and the Registry key kept in a
  `mcp-registry` environment that only `v*` tags can use.
- The skills use the server's current tools instead of the deprecated ones: `list_cloud_files`, `read_cloud_file`,
  `search_cloud_files`, `edit_cloud_file` and `write_cloud_files` for an instance's files, `deploy_resource` to deploy
  a PocketBase instance, and `create_resource`. write-hooks edits a hook file in place with the revision it read;
  ship-app reads what `pb_public` holds and says what each way of sending files removes. Frontends and backends
  deploy from the portal or with `pbc`.
- The README's Tools table matches the server: file deploys, live file edits, version history and restore,
  previews and pushing to GitHub in `deploy`.
- `npm run validate` knows the server's current tools, so `@write` in an eval covers the new write tools too. The eval
  runner also blocks `create_resource`, `deploy_resource` and `push_to_github`.
- The skills follow the server's smaller tool catalog (pbc-mcp #77 and #78). Overlapping tools became options:
  `get_overview` gives the plan and projects, and with `regions: true` the regions; `create_resource` makes a new
  project with `projectName`; `get_resource` and `get_collection` list without a name; `list_records` reads one
  record with `id` and counts with `count: true`; `get_logs` reads an instance's request log with `requests: true`.
  Custom domains, pushing to GitHub and continuous backup moved to the portal, and env values are typed only on the
  page `request_env_values` links. `generate_types` is gone, so design-collections and setup-user-accounts no longer
  end with types. change-schema restarts an instance with `restart_resource` after approval. launch-checklist's
  domain row reads the status from `get_resource`.
- Every tool group is on every connection, so the README and `llms-install.md` drop the `features` option, and the
  README's Tools table lists what each group covers and what is done in the portal.
- `npm run validate` lists only the tools the server offers now, so a skill eval that names a retired tool fails.
  Evals that need an option check for it with `must_call_matching`. The eval runner's setup connects with
  `legacy_tools=true` for the hook tools it still uses; the model under test sees only the current tools.

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
