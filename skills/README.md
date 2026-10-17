# PocketBase Cloud skills

Skills teach an agent the workflows that work well with the PocketBase Cloud MCP server, beyond what each tool's
own description says. Every packaged plugin in this repository installs them, and each one lives at
`skills/<name>/SKILL.md` per the [Agent Skills](https://agent-plugins.org/) convention.

| Skill | Use it for |
|---|---|
| [`getting-started`](getting-started/SKILL.md) | A first project and PocketBase instance: plan, project, region, instance. |
| [`debug-deploy`](debug-deploy/SKILL.md) | Why a deploy failed or an app does not start, and the command to deploy again. |
| [`review-security`](review-security/SKILL.md) | Finding API rules that are too open, and fixing them with the user. |
| [`setup-user-accounts`](setup-user-accounts/SKILL.md) | Users, per-user collections and safe rules: preview, back up, apply, check. |
| [`design-collections`](design-collections/SKILL.md) | An app's collections from its description: fields, relations, indexes and rules, from checked templates. |
| [`change-schema`](change-schema/SKILL.md) | Renaming, retyping or constraining fields that already hold data, without losing records. |
| [`investigate-errors`](investigate-errors/SKILL.md) | Why the app gets an error or an empty list from a running instance, and the narrowest fix. |
| [`launch-checklist`](launch-checklist/SKILL.md) | A read-only, scored check before an app goes live, with what it could not check. |
| [`write-hooks`](write-hooks/SKILL.md) | Server code in `pb_hooks`: validation, routes, cron jobs; reads the file first, deploys after approval. |
| [`ship-app`](ship-app/SKILL.md) | A site online: `pb_public` from the conversation, or `pbc` for bigger sites and frontends; always the whole site. |

All but `write-hooks` and `ship-app` follow a prompt the server itself offers (`getting_started`, `debug_deploy`, `review_security`,
`setup_auth`, `design_collections`, `change_schema`, `investigate_errors`, `launch_checklist`), with more detail on
each step.

All of them target `https://mcp.pocketbasecloud.com/mcp` and use only its tools. Every step that changes something
waits for the user's approval. When a tool a skill needs is missing, the connection is read-only or limited by its
options, and the skill says what to do instead.

Plans for the next skills, with the use cases and the research behind them, are in
[`docs/skill-design/`](../docs/skill-design/).
