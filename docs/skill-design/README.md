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
app, securing it and fixing a deploy. The server has 53 tools; most of the database, backup, hook and domain tools
have no workflow that tells an assistant the safe order to call them in.

**What other platforms do** ([research.md](research.md)): Supabase, Firebase, Neon, Convex, PlanetScale, Vercel,
Netlify and a dozen others ship a plugin with skills next to their MCP server. The ideas that fit us best: a short
router skill, a target guard before every change (Convex), approval of one named change (PlanetScale), rehearse
then promote (Neon), restore drills, a scored launch review that lists what it skipped (Convex), and evals against
a no-skill baseline with "must not" checks (Neon, Netlify).

**Proposed next (P0), in this order:**

1. `design-collections`: a data model from a description of the app, previewed, backed up, applied, checked.
2. `change-schema`: changes to collections that hold data (renames, type changes, required fields, unique
   indexes) without losing records.
3. `investigate-errors`: 400 / 403 / 404 / 5xx and "empty list" problems, traced to the rule, field or hook.
4. `launch-checklist`: one read-only, scored go-live review that hands each gap to the skill that fixes it.
5. `backup-and-restore`: backups, continuous backup, and restores that say what they bring back: records and
   files, not a deleted collection or field (the instance replays its migrations when it restarts). The way back
   for those is a new instance from the backup, which waits on a server tool, so this skill comes last.

The `pocketbase` router (a short skill that sends a request to the right skill and holds the shared rules) is
specified but deferred: its rules go into the server instructions first (B4), and the router ships only if the
boundary evals show the task skills under-trigger without it, because a skill described "use whenever the user
mentions PocketBase" can steal their triggers.

Then ten P1 skills for building, shipping and operating, and four P2 ones that wait on new server tools.

**Around the skills:** reference files inside each skill for progressive disclosure, a CI check that skills name
only real tools, evals with a baseline and boundary tests, the P0 skills as MCP prompts for claude.ai and ChatGPT,
and six tool changes still open in the server: a restore into a new instance first, since `backup-and-restore`
waits on it, then testing a rule as a given user, reading a hook back, and the instance's version and runtime
settings. The first gap found, full collection definitions from `get_collection`, shipped on 2026-10-17
(pbc-mcp PR #13).

## Relationship to pbc-mcp PR #2 (decided 2026-10-17)

[pbc-mcp PR #2](https://github.com/pocketbasecloud/pbc-mcp/pull/2) proposes search, a chat-first build flow and
PocketBase + htmx templates. The two proposals merge with this one as the frame: skills live in this repository,
with evals, and ship as 1.2.0. PR #2's pieces enter in this order: B4 (rewrite the server's `INSTRUCTIONS`) →
`search_docs` v2 (BM25 ranking) → its templates as input data for `design-collections` → its `install_template`
tool last, after a safe key-entry page and a safe file-write procedure exist. Dropped: PR #2's new public
`agent-kit` repository (skills stay here) and its "≤ 40 tools by default" budget.

## Principles every skill keeps

From the shipped skills and `CONTRIBUTING.md`, and confirmed by what works for other platforms:

1. **Name the target, read before writing.** Announce the project and instance, then start from their current
   state, never from assumptions.
2. **Preview, approve, back up, apply, verify.** In that order, for every change ([use-cases.md §3](use-cases.md#3-the-guardrail-every-skill-follows)).
3. **Degrade, don't fail.** On a read-only or narrowed connection, hand over the artifact (JSON, rule, command,
   migration file) and say how to reconnect.
4. **Untrusted data stays data.** Records and logs never carry instructions.
5. **Hand off.** End with the next skill, so a user can go from an idea to a live app one skill at a time.
