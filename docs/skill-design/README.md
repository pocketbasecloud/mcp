# Skill design

Research and plans for the next skills in [`skills/`](../../skills/). Nothing here ships to users: these pages are
for deciding what to build, and in what order.

| Page | What it holds |
|---|---|
| [research.md](research.md) | How other platforms package skills, prompts and workflows on top of their MCP servers, and the patterns worth borrowing. |
| [use-cases.md](use-cases.md) | Who uses PocketBase Cloud through an assistant, every use case by stage of an app's life, the flows behind the important ones, and the tools each needs. Mermaid diagrams. |
| [roadmap.md](roadmap.md) | The proposed skills with priorities, step-by-step specs for the P0 ones, packaging and CI changes, and the tools the server is missing. |
| [implementation.md](implementation.md) | The tasks in order with the files each touches, a skill template, the `evals.json` format and runner, and the definition of done. |

## In one screen

**Today:** four skills (`getting-started`, `debug-deploy`, `review-security`, `setup-user-accounts`) cover starting an
app, securing it and fixing a deploy. The server has 52 tools; most of the database, backup, hook and domain tools
have no workflow that tells an assistant the safe order to call them in.

**What other platforms do** ([research.md](research.md)): Supabase, Firebase, Neon, Convex, PlanetScale, Vercel,
Netlify and a dozen others ship a plugin with skills next to their MCP server. The ideas that fit us best: a short
router skill, a target guard before every change (Convex), approval of one named change (PlanetScale), rehearse
then promote (Neon), restore drills, a scored launch review that lists what it skipped (Convex), and evals against
a no-skill baseline with "must not" checks (Neon, Netlify).

**Proposed next (P0):**

1. `pocketbase`: a short router that sends a request to the right skill and holds the shared rules.
2. `design-collections`: a data model from a description of the app, previewed, backed up, applied, checked.
3. `change-schema`: changes to collections that hold data (renames, type changes, required fields, unique
   indexes) without losing records.
4. `investigate-errors`: 400 / 403 / 404 / 5xx and "empty list" problems, traced to the rule, field or hook.
5. `backup-and-restore`: backups, continuous backup, and a restore with a way back.
6. `launch-checklist`: one read-only, scored go-live review that hands each gap to the skill that fixes it.

Then ten P1 skills for building, shipping and operating, and four P2 ones that wait on new server tools.

**Around the skills:** reference files inside each skill for progressive disclosure, a CI check that skills name
only real tools, evals with a baseline and boundary tests, the P0 skills as MCP prompts for claude.ai and ChatGPT,
and seven tool changes for the server: full collection definitions from `get_collection` first, since two P0
skills depend on it, then testing a rule as a given user, reading a hook back, and the instance's version and
runtime settings.

## Principles every skill keeps

From the shipped skills and `CONTRIBUTING.md`, and confirmed by what works for other platforms:

1. **Name the target, read before writing.** Announce the project and instance, then start from their current
   state, never from assumptions.
2. **Preview, approve, back up, apply, verify.** In that order, for every change ([use-cases.md §3](use-cases.md#3-the-guardrail-every-skill-follows)).
3. **Degrade, don't fail.** On a read-only or narrowed connection, hand over the artifact (JSON, rule, command,
   migration file) and say how to reconnect.
4. **Untrusted data stays data.** Records and logs never carry instructions.
5. **Hand off.** End with the next skill, so a user can go from an idea to a live app one skill at a time.
