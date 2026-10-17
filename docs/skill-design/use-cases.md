# Use cases

What people need to do with PocketBase on PocketBase Cloud, who does it, and which skill (shipped or proposed) carries
it. The diagrams are Mermaid, so GitHub renders them in place.

Legend used in every diagram:

| Mark | Meaning |
|---|---|
| ✅ | A skill that ships today in [`skills/`](../../skills/) |
| 🟧 **P0** | Proposed next: frequent, or risky without guidance, and every tool it needs exists (`backup-and-restore` is the exception: its way back for a deleted collection or field needs a server tool, so it ships last) |
| ⬜ P1 / P2 | Proposed later |

## Actors

| Actor | Works in | Typical asks |
|---|---|---|
| **Developer** | Claude Code, Cursor, Codex, VS Code, Gemini CLI: skills installed with the plugin | "Add a `comments` collection", "why is `/api/collections/posts/records` slow?", "write a hook that emails on sign-up" |
| **App owner** | claude.ai, ChatGPT: connector only, so the server's prompts, not the skills | "How many orders were paid this week?", "is my app up?", "is my data safe?" |
| **CI or script** | A CLI token, usually `read_only=true` and one `project_ref` | Health and security checks on a schedule |
| **PocketBase instance** | Reached only through PocketBase Cloud's proxy | Holds collections, rules, records, hooks, backups, logs |

## 1. Use-case map

Every use case grouped by the stage of an app's life. A skill name under a use case is the skill that carries it.
The `pocketbase` router skill (proposed, deferred behind B4) isn't a use case of its own: it would route to these;
the rules they share go into the server instructions first.

```mermaid
flowchart LR
  dev["👤 Developer<br/>Claude Code · Cursor · Codex"]
  owner["👤 App owner<br/>claude.ai · ChatGPT"]
  ci["⚙️ CI / script<br/>CLI token, read only"]

  subgraph system["PocketBase Cloud MCP server + skills"]
    subgraph start["1 · Start"]
      s1(["Create a project<br/>and an instance<br/><b>getting-started</b> ✅"])
      s2(["Move an app onto<br/>PocketBase Cloud<br/><b>migrate-to-cloud</b> ⬜ P2"])
    end

    subgraph model["2 · Model the data"]
      m1(["Design collections<br/>from an app idea<br/><b>design-collections</b> 🟧 P0"])
      m2(["Change a schema<br/>that holds data<br/><b>change-schema</b> 🟧 P0"])
      m3(["Seed or import records<br/><b>import-data</b> ⬜ P1"])
    end

    subgraph secure["3 · Secure"]
      x1(["Users and owned data<br/><b>setup-user-accounts</b> ✅"])
      x2(["Review API rules<br/><b>review-security</b> ✅"])
      x3(["Teams, roles,<br/>multi-tenant rules<br/><b>teams-and-roles</b> ⬜ P2"])
      x4(["Sign in with<br/>Google, GitHub…<br/><b>setup-oauth-login</b> ⬜ P2"])
    end

    subgraph build["4 · Build the app"]
      b1(["Connect the app: SDK,<br/>types, auth, realtime<br/><b>connect-app</b> ⬜ P1"])
      b2(["Server logic in pb_hooks<br/><b>write-hooks</b> ⬜ P1"])
      b3(["Scheduled jobs<br/><b>schedule-jobs</b> ⬜ P1"])
      b4(["File uploads,<br/>protected files<br/><b>file-uploads</b> ⬜ P2"])
    end

    subgraph ship["5 · Ship"]
      d1(["Pick the deploy path<br/><b>ship-app</b> ⬜ P1"])
      d2(["Fix a failed deploy<br/><b>debug-deploy</b> ✅"])
      d3(["Custom domain and DNS<br/><b>custom-domain</b> ⬜ P1"])
      d4(["Environment variables<br/><b>manage-env</b> ⬜ P1"])
      d5(["Go-live review<br/><b>launch-checklist</b> 🟧 P0"])
    end

    subgraph operate["6 · Operate"]
      o1(["Why the app<br/>returns errors<br/><b>investigate-errors</b> 🟧 P0"])
      o2(["Slow requests, indexes<br/><b>tune-performance</b> ⬜ P1"])
      o3(["Questions about the data<br/><b>explore-data</b> ⬜ P1"])
      o4(["Understand an instance<br/>someone else built<br/><b>explain-instance</b> ⬜ P1"])
    end

    subgraph protect["7 · Protect"]
      r1(["Backups and restore,<br/>continuous backup<br/><b>backup-and-restore</b> 🟧 P0"])
    end

    start ~~~ model ~~~ secure ~~~ build ~~~ ship ~~~ operate ~~~ protect
  end

  pb[("PocketBase instance<br/>collections · rules · records · hooks · backups · logs")]

  dev -->|every stage| system
  owner -->|"start, secure, operate"| system
  ci -.->|"read only: secure, operate"| system
  system ==>|through PocketBase Cloud's proxy| pb

  classDef shipped fill:#d3f5d6,stroke:#2e7d32,color:#111
  classDef p0 fill:#ffe2b8,stroke:#e65100,color:#111
  classDef later fill:#eceff1,stroke:#90a4ae,color:#111
  class s1,x1,x2,d2 shipped
  class m1,m2,d5,o1,r1 p0
  class s2,m3,x3,x4,b1,b2,b3,b4,d1,d3,d4,o2,o3,o4 later
```

**Coverage today:** the four shipped skills cover *Start*, *Secure* and one *Ship* case. *Model the data* past user
accounts, *Build*, *Operate* and *Protect* have tools on the server but no workflow that ties them together, so an
assistant has to discover the safe order by itself.

## 2. The journey: how skills hand off

Each skill ends by pointing at the next one, the way `getting-started` already points at `setup-user-accounts`. The
operate loop at the bottom is where an app spends most of its life.

```mermaid
flowchart TD
  gs["getting-started ✅"] --> dc["design-collections 🟧"]
  gs -.->|existing app| mtc["migrate-to-cloud ⬜"]
  mtc -.-> dc
  dc --> sua["setup-user-accounts ✅"]
  dc --> imp["import-data ⬜"]
  sua --> rs["review-security ✅"]
  dc --> rs
  rs --> ca["connect-app ⬜"]
  ca --> wh["write-hooks ⬜"]
  wh --> sj["schedule-jobs ⬜"]
  ca --> ship["ship-app ⬜"]
  wh --> ship
  ship --> env["manage-env ⬜"]
  ship --> dom["custom-domain ⬜"]
  ship -->|deploy failed| dd["debug-deploy ✅"]
  dd --> ship
  dom --> lc["launch-checklist 🟧"]
  env --> lc
  rs --> lc
  lc -->|live| live(("app is live"))

  live --> ie["investigate-errors 🟧"]
  live --> tp["tune-performance ⬜"]
  live --> ed["explore-data ⬜"]
  live --> cs["change-schema 🟧"]
  cs --> rs
  ie -->|a rule blocks users| rs
  ie -->|bad deploy| dd
  ie -->|data damaged| br["backup-and-restore 🟧"]
  tp -->|add indexes| cs
  br -.->|before every risky change| cs

  classDef shipped fill:#d3f5d6,stroke:#2e7d32,color:#111
  classDef p0 fill:#ffe2b8,stroke:#e65100,color:#111
  classDef later fill:#eceff1,stroke:#90a4ae,color:#111
  class gs,sua,rs,dd shipped
  class dc,cs,lc,ie,br p0
  class mtc,imp,ca,wh,sj,ship,env,dom,tp,ed later
```

## 3. The guardrail every skill follows

The shipped skills already do this; the proposed ones must too. It is also what `CONTRIBUTING.md` asks of a skill.

```mermaid
flowchart TD
  ask["User asks for a change"] --> target["Step 0: resolve the project and instance,<br/>announce the target in one line"]
  target --> ro{"User said<br/>read only?"}
  ro -->|yes| hand
  ro -->|no| read["Read the current state<br/>list_* / get_* / check_*"]
  read --> tool{"Is the write tool<br/>on this connection?"}
  tool -->|"no: read_only, project_ref<br/>or features leave it out"| hand["Hand the user the artifact instead:<br/>collection JSON, rule, pbc command,<br/>migration file — and say how to reconnect"]
  tool -->|yes| plan["Propose the exact change<br/>preview_collections when it is schema"]
  plan --> ok{"User approves that exact<br/>change on that target?"}
  ok -->|no| plan
  ok -->|yes| risky{"Can it lose data<br/>or lock users out?"}
  risky -->|yes| backup["create_backup<br/>and tell the backup's name"]
  risky -->|no| apply
  backup --> apply["Apply<br/>confirm: true only now"]
  apply --> verify["Verify<br/>check_security · check_performance ·<br/>count_records · get_logs"]
  verify --> next["Report what changed,<br/>the way back, and the next skill"]
```

"The way back" is not always `restore_backup`. PocketBase Cloud instances run with `--automigrate=true` and keep
`pb_migrations` outside `pb_data`, so a restore brings records and files back but replays every collection change
made since the backup when the instance restarts: a deleted collection or field is deleted again.
`delete_collection` and `remove_fields` therefore answer with no `undo` (pbc-mcp PR #14); `truncate_collection`
still does, since it removes records only. For the two schema deletions the way back is the backup restored into a
**new** instance, `pbc pocketbase create <name> --backup <file>`, and a skill says so before the user approves.

## 4. Key flows

### 4.1 A safe schema change

Shared by `design-collections`, `change-schema`, `setup-user-accounts` and the index step of `tune-performance`. The
one decision that is easy to get wrong: if the app keeps `pb_migrations/` in git, the migration file is the source of
truth, not the live instance.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant A as Assistant + skill
  participant M as MCP server
  participant P as PocketBase instance

  U->>A: "Add tags to posts, and make price a number"
  A->>M: list_collections, get_collection(posts)
  M->>P: read schema
  P-->>A: fields, rules, indexes
  Note over A: price is text today: a type change.<br/>apply_collections refuses it, so plan<br/>add price_num → copy → remove price.<br/>indexes: send the current ones too,<br/>and a changed field in full, with its id
  A->>M: preview_collections(defs, migration: true)
  M-->>A: diff + pb_migrations file
  A->>U: The diff, the data step, the migration file. Go?
  U->>A: Yes
  A->>M: create_backup(before-posts-tags.zip)
  A->>M: apply_collections(defs)
  M->>P: import, deleteMissing false
  A->>M: upsert_records(posts, id + price_num, 100 per call) to copy the values
  A->>M: count_records(posts, groups) to check the copy
  A->>M: check_security, then generate_types
  A->>U: Done. Backup name, migration file to commit, new types
```

### 4.2 "My app is returning errors"

`investigate-errors` reads from the outside in: the platform, then the instance, then the request, then the rule or
hook behind it. PocketBase hides records a rule filters out instead of refusing, so "fewer items than expected" and
"404 on a record that exists" are rule problems, not data problems. A warning `instance_unreachable` is the one
case where nothing in the app is wrong: the platform's link to the instance is.

```mermaid
flowchart TD
  q["App errors, empty lists,<br/>403 / 404 / 5xx"] --> dr["diagnose_resource<br/>status · deploys · log errors · 5xx · domain"]
  dr --> v{"verdict"}
  v -->|instance down or<br/>last deploy failed| dd["debug-deploy ✅"]
  v -->|domain broken| dom["custom-domain ⬜"]
  v -->|"warning instance_unreachable"| unr["PocketBase Cloud can't reach the instance<br/>→ retry, then support with the instance id"]
  v -->|healthy or other warning| rl["get_request_logs<br/>filter data.status >= 400"]
  rl --> code{"status"}
  code -->|"400"| f400["Validation: required field,<br/>wrong type, unique index<br/>→ get_collection, show the field"]
  code -->|"401 / 403"| f403["Not signed in, or the rule<br/>is null: superusers only<br/>→ review-security ✅"]
  code -->|"200 with fewer items,<br/>404 on a record that exists"| fhide["A rule filtered it out<br/>→ explain the rule for that user"]
  code -->|"5xx"| f500["Hook or query failed<br/>→ get_logs, list_hooks<br/>→ write-hooks ⬜"]
  code -->|slow, no error| tp["tune-performance ⬜"]
```

### 4.3 Server logic with hooks

`deploy_hooks` writes straight into `pb_hooks` and replaces files with the same name, and there is no tool to read a
hook's content back, so the skill keeps the previous version in the conversation before overwriting it.

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant A as Assistant + skill
  participant M as MCP server

  U->>A: "Send a welcome email when someone signs up"
  A->>M: search_docs("onRecordCreate hook mail")
  A->>M: list_hooks(resource)
  Note over A: Same file name already there?<br/>Ask for its content or use a new file
  A->>U: The hook code, the file name, what it does
  U->>A: Deploy it
  A->>M: deploy_hooks(files)
  A->>M: create_record in a test collection, or ask the user to sign up once
  A->>M: get_logs(pocketbase, lines: 100)
  A->>U: Works / the error line and the fix
```

### 4.4 Import data

```mermaid
flowchart LR
  src["CSV / JSON / another DB export"] --> map["Map columns to fields<br/>get_collection"]
  map --> gap{"Fields missing?"}
  gap -->|yes| cs["change-schema 🟧"]
  gap -->|no| order["Order by relations<br/>parents before children"]
  cs --> order
  order --> sample["create_records: 5 rows first"]
  sample --> check{"All created?"}
  check -->|no| fix["Fix the mapping from<br/>the failures by position"]
  fix --> sample
  check -->|yes| batch["create_records in batches of 100"]
  batch --> verify["count_records against the source"]
```

### 4.5 Launch checklist

`launch-checklist` calls no write tool; each failed check hands off to the skill that fixes it, and that skill
applies the fix.

```mermaid
flowchart TD
  lc["launch-checklist 🟧"] --> plan["get_plan<br/>paid plan, not a trial ending at launch"]
  lc --> sec["check_security<br/>no critical, warnings explained"]
  lc --> perf["check_performance<br/>no slow route without an index"]
  lc --> bk["list_backups + continuous backup<br/>a recent backup exists"]
  lc --> dev["dev mode off<br/>not assessed until B2: ask"]
  lc --> dom["check_domain<br/>custom domain answers"]
  lc --> diag["diagnose_resource<br/>healthy, no recent failed deploy"]
  lc --> env["list_env_vars<br/>every name the app reads is set"]
  sec -->|fail| rs["review-security ✅"]
  perf -->|fail| tp["tune-performance ⬜"]
  bk -->|fail| br["backup-and-restore 🟧"]
  dom -->|fail| cd["custom-domain ⬜"]
  diag -->|fail| ie["investigate-errors 🟧"]
```

## 5. Use cases × tools

Which tool groups each use case needs. `env` and `database_admin` are opt-in, so a skill that needs them must say what
to do when they are missing.

| Use case | Skill | account | resources | deploy | domains | database | docs | env | database_admin |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Route and shared rules | pocketbase (router), deferred | ○ | ○ | | | | ● | | |
| First project and instance | getting-started ✅ | ● | ● | ○ | | | ○ | | |
| Fix a failed deploy | debug-deploy ✅ | ○ | | ● | | | | | |
| Users and owned data | setup-user-accounts ✅ | | | | | ● | ○ | | |
| Review API rules | review-security ✅ | | ○ | | | ● | ○ | | |
| Design collections | design-collections 🟧 | | ○ | | | ● | ● | | |
| Change a schema with data | change-schema 🟧 | | | | | ● | ○ | | ○ |
| Errors in a running app | investigate-errors 🟧 | | | ● | ○ | ● | ○ | | |
| Backups and restore | backup-and-restore 🟧 | ○ | ● | | | ● | | | ● |
| Go-live review | launch-checklist 🟧 | ● | ● | ● | ● | ● | | ○ | |
| Slow requests | tune-performance ⬜ | | ○ | | | ● | ○ | | |
| Questions about data | explore-data ⬜ | | ○ | | | ● | | | |
| Understand an instance | explain-instance ⬜ | | ○ | ● | | ● | | | |
| Seed or import | import-data ⬜ | | | | | ● | | | ○ |
| Connect the app | connect-app ⬜ | | ● | | | ● | ● | ○ | |
| Hooks | write-hooks ⬜ | | | ● | | ○ | ● | | |
| Cron jobs | schedule-jobs ⬜ | | | ● | | ● | ● | | |
| Deploy path | ship-app ⬜ | ○ | ● | ● | | | ○ | ○ | |
| Custom domain | custom-domain ⬜ | | ● | | ● | | | | |
| Environment variables | manage-env ⬜ | | ● | ○ | | | | ● | |
| Teams and roles | teams-and-roles ⬜ | | | | | ● | ● | | |
| OAuth sign-in | setup-oauth-login ⬜ | | ○ | | | ● | ● | | |
| Files | file-uploads ⬜ | | | | | ● | ● | | |
| Move onto PocketBase Cloud | migrate-to-cloud ⬜ | ● | ● | ● | | ● | ● | | |

● needed · ○ used when available

## 6. What the connection options do to a use case

| Option | Effect on the skills | What the skill should say |
|---|---|---|
| `read_only=true` | Only *read* steps run: `check_*`, `list_*`, `get_*`, `diagnose_resource`, `preview_collections`, `generate_types`. | Give the change as an artifact (collection JSON, rule, `pbc` command, migration file) and say how to reconnect with read and write. |
| `project_ref=<id>` | `list_projects` and `create_project` disappear; everything is scoped to one project. | Don't offer to create a project; work in the one that is connected. |
| `features` without `database` | No database tools at all. | Say which group to add to the URL. |
| `features` without `env` (default) | `manage-env` and the env step of `launch-checklist` can't run. | Point to `pbc env` on the user's machine, or add `env` to `features`. |
| `features` without `database_admin` (default) | No `restore_backup`, `remove_fields`, `truncate_collection`, `delete_collection`, `delete_backup`. | For a restore or a field type change, explain the step and how to enable `database_admin` for that session only. |
| claude.ai / ChatGPT | Skills are not installed; only the server's prompts and tool descriptions guide the model. | The P0 skills should also ship as MCP prompts (see [roadmap](roadmap.md#ship-p0-skills-as-mcp-prompts-too)). |
