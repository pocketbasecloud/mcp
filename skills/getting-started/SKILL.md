---
name: getting-started
description: "Set up a first PocketBase Cloud project and PocketBase instance with the user. Use when the user wants to start a new app or backend on PocketBase Cloud, asks how to begin, or has an account but no project or instance yet. Checks the plan first, creates the project and instance only after the user agrees, waits until the instance runs, and points to the next step."
---

# Getting started on PocketBase Cloud

## Keywords
get started, new app, new backend, first project, create project, create instance, create pocketbase, set up pocketbase, start building, which region, new database

## Overview

Takes a user from an account to a running PocketBase instance: plan check, project, region, instance. Every step
that creates something waits for the user's agreement.

**Use this skill when** the user wants to start building on PocketBase Cloud, or asks to create a project or a
PocketBase instance.

---

## Workflow

### Step 1: Check the plan

Call `get_plan`.

- If `canDeploy` is false, tell the user in one or two lines what `nextStep` says, and wait until they say it is
  sorted. Then call `get_plan` again before going on.
- If a Free trial is running, say in one line how many days are left, then go on without waiting.

### Step 2: Pick or create a project

Call `list_projects`.

- If the user already has projects, ask which one to use, or whether to create a new one.
- If there is none, propose a short project name from what they want to build, and call `create_project` with
  `name` once they agree.

### Step 3: Pick a region

Call `list_regions` (with `project` when one was chosen). Propose the region nearest to the user or to their
users, and say why in a few words. If the account has its own compute, mention it as an option.

### Step 4: Create the instance

Propose an instance name (lowercase, hyphens, e.g. `shop-db`). Once the user agrees, call `create_pocketbase` with
`name`, `project`, and either `location` (a region code from step 3) or `compute` (an id of the account's own
compute).

The call returns at once with status `creating`. The superuser is the account's email; its password is generated
and never shown. Tell the user to set their own with `pbc pocketbase superuser sync` or in the PocketBase Cloud
portal, as the tool's reply says.

### Step 5: Wait until it runs

Call `get_resource` with `kind: "pocketbase"` and the instance name until its status is `running`. If it fails,
read `statusReason`, the plain-language reason it returns, and call `diagnose_resource` for the details.

Give the user the instance's address from `domain` (`https://<domain>`) and its admin UI at `https://<domain>/_/`.

### Step 6: Suggest the next step

- Code for their app: `search_docs` for the PocketBase JS SDK, auth, realtime or files.
- Deploying a frontend or backend: `get_deploy_command`, which returns the `pbc` command to run on their machine.

---

## Rules

- Never create a project or an instance without the user's agreement on its name.
- If `create_project` or `create_pocketbase` is not available, the connection is read-only: say so, and tell the
  user to reconnect with read and write access.
- Do not guess region codes or compute ids; use what `list_regions` returns.

## Example

> **User:** I want to build a recipe sharing app on PocketBase Cloud.
>
> **Assistant:** checks the plan (trial, 9 days left), finds no project, proposes `recipes`, creates it after a
> yes, proposes Singapore as the nearest region and `recipes-db` as the instance, creates it after a yes, waits
> until it runs, then gives the admin URL and suggests setting up user accounts next.
