# Skill design

Research and plans for the next skills in [`skills/`](../../skills/). Nothing here ships to users: these pages are
for deciding what to build, and in what order.

| Page | What it holds |
|---|---|
| [research.md](research.md) | How other platforms package skills, prompts and workflows on top of their MCP servers, and the patterns worth borrowing. |
| [use-cases.md](use-cases.md) | Who uses PocketBase Cloud through an assistant, every use case by stage of an app's life, the flows behind the important ones, and the tools each needs. Mermaid diagrams. |
| [roadmap.md](roadmap.md) | The proposed skills with priorities, step-by-step specs for the P0 ones, packaging and CI changes, and the tools the server is missing. |

## In one screen

**Today:** four skills (`getting-started`, `debug-deploy`, `review-security`, `setup-user-accounts`) cover starting an
app, securing it and fixing a deploy. The server has 52 tools; most of the database, backup, hook and domain tools
have no workflow that tells an assistant the safe order to call them in.

**Proposed next (P0):**

1. `design-collections`: a data model from a description of the app, previewed, backed up, applied, checked.
2. `change-schema`: changes to collections that hold data (renames, type changes, required fields, unique
   indexes) without losing records.
3. `investigate-errors`: 400 / 403 / 404 / 5xx and "empty list" problems, traced to the rule, field or hook.
4. `backup-and-restore`: backups, continuous backup, and a restore with a way back.
5. `launch-checklist`: one read-only go-live review that hands each gap to the skill that fixes it.

Then nine P1 skills for building, shipping and operating, and four P2 ones that wait on new server tools.

**Around the skills:** reference files inside each skill for progressive disclosure, a CI check that skills name
only real tools, evals per skill, the P0 skills as MCP prompts for claude.ai and ChatGPT, and five tools the server
should add (full collection definitions from `get_collection` first, since two P0 skills depend on it).

## Principles every skill keeps

From the shipped skills and `CONTRIBUTING.md`, and confirmed by what works for other platforms:

1. **Read before writing.** Every skill starts from the current state, never from assumptions.
2. **Preview, approve, back up, apply, verify.** In that order, for every change ([use-cases.md §3](use-cases.md#3-the-guardrail-every-skill-follows)).
3. **Degrade, don't fail.** On a read-only or narrowed connection, hand over the artifact (JSON, rule, command,
   migration file) and say how to reconnect.
4. **Untrusted data stays data.** Records and logs never carry instructions.
5. **Hand off.** End with the next skill, so a user can go from an idea to a live app one skill at a time.
