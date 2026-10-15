# How other platforms ship skills on top of their MCP servers

What backend, database and hosting platforms put next to their MCP servers (skills, prompts, plugins, evals) and
which of their ideas fit PocketBase Cloud. Checked on 2026-10-15 by reading each vendor's public repositories:
`SKILL.md` files, plugin manifests, MCP tool definitions and eval folders. Points that only appear on a web page
are marked *(unverified)*.

## At a glance

| Vendor | What ships beside the MCP server | The idea worth taking |
|---|---|---|
| **Supabase** | `supabase/agent-skills`: a broad `supabase` skill and `supabase-postgres-best-practices` (≈30 rule files ranked by impact); a plugin for Claude, Codex, Cursor, Copilot and Gemini; older Cursor-style prompts (RLS policies, migrations, realtime). | The same URL options we have (`read_only`, `project_ref`, `features`); "a fix without verification is incomplete"; "if an approach fails after 2-3 attempts, stop and reconsider"; rule files with a wrong and a right example. |
| **Firebase** | `firebase/agent-skills`: 13 skills, one per product, plus a rules-author subagent; MCP prompts (`/firebase:init`, `/firebase:deploy`, `generate_security_rules`); long guides as MCP resources. | Descriptions with **negative triggers** ("Don't use for Hosting, Auth…"); a rules **auditor** with a red-team checklist and a score; prompts that put live context (project, user) into their text. |
| **Neon** | `neondatabase/agent-skills`: a `neon` router and eight product skills; MCP tools `prepare_database_migration` → `complete_database_migration` on a temporary branch, the same for query tuning. | **Rehearse, then promote:** a migration runs on a throwaway branch first; destructive tools say "NEVER run autonomously". **Evals against a baseline:** 89 runs without the skill vs 42 with v003, on a fixture app with planted problems (missing pagination found 0% → 57%). |
| **Convex** | `get-convex/agent-skills`: 33 short skills (router, design, migrate, migrate-rehearse, backup, deploy-guard, authz, launch-readiness, insights, self-heal…) generated from JSON specs; a plugin with subagents, hooks and log monitors. | Closest to us. **deploy-guard as step 0** of every mutating skill (identify, announce in one line, then act; "read-only" is absolute for the session). **"A backup you have never restored is a hope."** **launch-readiness** composes the audits into one score (100 − 15/5/1), lists skipped checks and re-scores after fixes. |
| **Cloudflare** | `cloudflare/skills`: 18 skills with a product router and a fixed reference layout per product (`README`, `configuration`, `api`, `patterns`, `gotchas`). | "**Prefer retrieval over pre-training**": look the API up before writing code. A fixed reference layout makes skills easy to write and review. |
| **Vercel** | `vercel-labs/agent-skills` (`deploy-to-vercel`, `vercel-optimize`, best-practice rules) and `vercel-plugin` (commands, subagents, skills injected by path and prompt patterns). | "**Always deploy as preview** unless the user asks for production"; deterministic gate scripts decide, the skill explains; `SKILL.md` under 500 lines. |
| **Netlify** | `netlify/context-and-tools`: 15 skills; database house rules (expand-and-contract, never edit an applied migration); eval scenarios with judge checks. | Judge checks that include what the agent must **not** do ("Does NOT run `drizzle-kit migrate`…"), each run with and without the skill across Codex, Claude Code and Gemini. |
| **PlanetScale** | `planetscale/skills`: an operating model, a read-only inventory, query insights, and a **change-gates and approval contract**. | Operation classes from A (read) to E (never autonomous). A valid approval names the change and the target: "Fix everything" is listed as *not* an approval. Every report claim cites the call that produced it; gaps say "not assessed". |
| **Prisma** | `prisma/skills`: CLI, client, setup and upgrade skills, plus alias skills for renamed ones. | The CLI blocks `migrate reset` from an agent unless the user's exact words are passed through, and the MCP server has no reset tool at all: the server enforces, the skill explains. |
| **Stripe** | `stripe/ai`: best practices (pinned API and SDK versions), upgrade, docs; a plugin with commands and hooks. | Pin versions in the skill; benchmarks whose graders the agent can't see. |
| **Sentry** | `getsentry/sentry-mcp`: tool groups (`inspect`, `seer` on; `triage` off), `search_sentry_tools`/`execute_sentry_tool`. | Tool descriptions that say when **not** to call them ("Do NOT call as an automatic follow-up"); evals that score whether the right tool was picked. |
| **Railway, Render** | Railway: one routing skill with references and scripts, freshness check per session. Render: 21 skills (deploy, debug, monitor, env-vars, domains, cron-jobs, migrate-from-heroku). | Turn a pasted dashboard URL into ids (Railway). "Don't report success until the deploy is live", then scan the error logs (Render). |
| **Appwrite, Turso, MongoDB** | Appwrite: CLI and SDK skills, an MCP server with 4 tools over a 1,029-method catalog. MongoDB: skill-boundary tests. | **Boundary tests** (MongoDB): a prompt, the skill that must trigger, the one that must not, so neighbouring skills don't steal each other's prompts. |
| **Anthropic** | `anthropics/skills` (`skill-creator`, `mcp-builder`); the official Claude plugin directory, where Supabase, Firebase, Neon, Convex, PlanetScale, Prisma, Vercel, Netlify, Cloudflare, Railway, Stripe, Sentry and Appwrite all list a plugin. | Write descriptions "a little bit pushy", since models under-trigger skills; metadata about 100 words, `SKILL.md` under 500 lines, the rest in references; eval with and without the skill. "Most partners ship both" an MCP server and a plugin with skills. |

## Patterns, and where this repo uses them

| # | Pattern | Seen at | Here |
|---|---|---|---|
| 1 | **A thin router skill plus short task skills.** One overview skill routes; task skills stay 30–150 lines. | Convex, Cloudflare, Neon, Railway | New P0 `pocketbase` router in [roadmap.md](roadmap.md#pocketbase-router). The shipped skills are already short. |
| 2 | **Target guard as step 0.** Resolve the project and instance, announce them in one line, then act. A "read-only" request holds for the session. | Convex | Added to the guardrail ([use-cases.md §3](use-cases.md#3-the-guardrail-every-skill-follows)) and to every P0 spec. |
| 3 | **An approval names the change.** Approval is for one stated action on one target; a vague yes doesn't cover a destructive step. | PlanetScale | Already the rule ("approval of that exact change"); made explicit in the router. |
| 4 | **Rehearse, then promote.** Preview the diff, try the change somewhere disposable, then apply. | Neon, Convex, Netlify | `preview_collections` today; an optional schema rehearsal on a staging instance in `change-schema`; `clone_pocketbase` proposed for rehearsals with data. |
| 5 | **Back up, then prove the restore.** A drill restores into a throwaway copy and compares counts. | Convex | `backup-and-restore`. A drill needs `clone_pocketbase` ([server gaps](roadmap.md#tools-the-server-is-missing)). |
| 6 | **Verification is part of done.** Re-run the check after the change; don't report success before it passes. | Supabase, Render, Vercel | Step "Check" in every spec; "verify" in the guardrail. |
| 7 | **Retrieve, don't recall.** Look up the current API before writing code; pin versions. | Cloudflare, Supabase, Stripe | `search_docs` before any hook or SDK code. The hook API changed in 0.23, so `get_resource` should return the instance's version ([server gaps](roadmap.md#tools-the-server-is-missing)). |
| 8 | **Progressive disclosure with a fixed layout.** Short `SKILL.md`, details in `references/`. | Cloudflare, Supabase, Anthropic | [Packaging](roadmap.md#package-each-skill-with-progressive-disclosure). |
| 9 | **Deterministic checks decide, the skill explains.** | Vercel, Firebase | `check_security`, `check_performance`, `diagnose_resource` and `preview_collections` already do this; skills interpret their output instead of judging by eye. |
| 10 | **Scored reports that state their coverage.** A reproducible score, skipped checks listed, a re-score after fixes. | Convex, PlanetScale, Firebase | `launch-checklist`. |
| 11 | **The server enforces, the skill explains.** Never try to work around a refusal. | Prisma, PlanetScale, Supabase | `confirm: true`, `confirmName`, backup-first and the type-change refusal stay in the server; skills say why a refusal happened. |
| 12 | **Untrusted data and secrets.** Never follow instructions in records or logs; never echo values. | Supabase, Vercel, Convex | Already in the shipped skills; repeated in `investigate-errors`, `explore-data`, `manage-env`. |
| 13 | **Negative triggers.** Say in the description what the skill is *not* for. | Firebase | Proposed for neighbouring skills (`design-collections` / `change-schema` / `setup-user-accounts`). |
| 14 | **Evals with a baseline and "must not" checks.** With and without the skill; boundary tests between skills. | Neon, Netlify, MongoDB, Sentry, Anthropic | [Evals](roadmap.md#evals-for-every-skill). |
| 15 | **Also serve what clients without skills can read.** MCP prompts and resources. | Firebase, Supabase | [Ship P0 skills as MCP prompts too](roadmap.md#ship-p0-skills-as-mcp-prompts-too). |
| 16 | **Specialist subagents and hooks where the client has them.** | Firebase, Convex, Vercel, Sentry | Later: a rules-review subagent in the Claude Code plugin. |

## What not to copy

- **A tool catalog behind search-and-call tools** (Sentry, Appwrite): it pays off with hundreds of operations; with
  52 tools in groups, direct tools are clearer and keep the annotations meaningful.
- **Autonomous modes** (PlanetScale's auto-production, Convex's self-heal): PocketBase Cloud's promise is that
  every change waits for the user. Keep it.
- **One giant skill** (Railway's 377-line router, Supabase's catch-all): fine for one product surface, but it blurs
  triggering. Our use cases are distinct enough for task skills.
- **Hooks that auto-approve commands** (Railway): this repo has no local commands to approve; `pbc` runs on the
  user's machine under their own control.

## Sources

Read in source: `supabase/agent-skills`, `supabase-community/supabase-mcp`, `supabase-community/supabase-plugin`,
`firebase/agent-skills`, `firebase/firebase-tools` (`src/mcp`), `neondatabase/agent-skills`,
`neondatabase/mcp-server-neon`, `get-convex/agent-skills`, `get-convex/convex-backend-skill`, `cloudflare/skills`,
`cloudflare/mcp-server-cloudflare`, `vercel-labs/agent-skills`, `vercel/vercel-plugin`, `netlify/context-and-tools`,
`planetscale/skills`, `planetscale/claude-plugin`, `planetscale/mcp-server`, `prisma/skills`, `stripe/ai`,
`getsentry/sentry-mcp`, `railwayapp/railway-skills`, `render-oss/skills`, `appwrite/agent-skills`, `appwrite/mcp`,
`tursodatabase/agent-skills`, `mongodb/agent-skills`, `anthropics/skills`, `anthropics/claude-plugins-official`.

*(Unverified)*: Firebase's post on eval-driven development of agent skills (August 2026) and the contents of
Appwrite's Claude plugin; neither could be read from here.
