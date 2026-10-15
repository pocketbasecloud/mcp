# PocketBase Cloud skills

Skills teach an agent the workflows that work well with the PocketBase Cloud MCP server, beyond what each tool's
own description says. Every packaged plugin in this repository installs them, and each one lives at
`skills/<name>/SKILL.md` per the [Agent Skills](https://agent-plugins.org/) convention.

| Skill | Use it for |
|---|---|
| [`getting-started`](getting-started/SKILL.md) | A first project and PocketBase instance: plan, project, region, instance. |
| [`review-security`](review-security/SKILL.md) | Finding API rules that are too open, and fixing them with the user. |
| [`debug-deploy`](debug-deploy/SKILL.md) | Why a deploy failed or an app does not start, and the command to deploy again. |
| [`setup-user-accounts`](setup-user-accounts/SKILL.md) | Users, per-user collections and safe rules: preview, back up, apply, check. |

They follow the prompts the server itself offers (`getting_started`, `review_security`, `debug_deploy`,
`setup_auth`), with more detail on each step.

All of them target `https://mcp.pocketbasecloud.com/mcp` and use only its tools. Every step that changes something
waits for the user's approval. When a tool a skill needs is missing, the connection is read-only or limited by its
options, and the skill says what to do instead.
