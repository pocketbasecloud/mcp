---
name: setup-user-accounts
description: "Design user accounts and per-user data in a PocketBase instance on PocketBase Cloud: the users auth collection, collections each user owns, and API rules so users only see and change their own records. Use when the user wants sign-up and login, wants each user to have their own data (posts, notes, orders), or asks how to structure collections and rules for an app. Previews the change, backs up, and applies it only after approval."
---

# Set up user accounts

## Keywords
user accounts, sign up, login, authentication, auth collection, users collection, own data, owner, per-user data, multi-user, collections design, schema, data model, api rules for users

## Overview

Designs the users auth collection and the collections each user owns, with API rules that keep every user to their
own records, then applies it safely: preview, backup, apply, security check, TypeScript types.

**Use this skill when** the user wants sign-up and login, or per-user data, in a PocketBase instance.

---

## Workflow

### Step 1: Read what exists

Call `list_collections` with `resource`, then `get_collection` for the collections that matter (always `users` if
it exists). Keep what is there: collections and fields not in the plan are left alone.

### Step 2: Propose the plan

Describe, in a short list:

- **The `users` auth collection:** the extra fields the app needs (for example `name`, `avatar`).
- **Each owned collection:** its fields, and an `owner` relation to `users` (required, single).
- **The rules of every collection**, so users only see and change their own records:

| Rule | Owned records |
|---|---|
| `listRule`, `viewRule` | `owner = @request.auth.id` |
| `createRule` | `@request.auth.id != "" && @request.body.owner = @request.auth.id` |
| `updateRule` | `owner = @request.auth.id && @request.body.owner:changed = false` |
| `deleteRule` | `owner = @request.auth.id` |

`:changed = false` keeps a user from handing a record to someone else. Adjust for data that is meant to be shared
(for example published posts anyone may read). When unsure about a field type or rule, call `search_docs`; the
reference is https://pocketbase.io/docs/api-rules-and-filters/.

### Step 3: Preview and ask

Call `preview_collections` with `resource` and `collections` (the same JSON as the admin UI's import). It shows
what would change without changing anything: collections created, fields added or changed, rules opened or
locked, and type changes that would be refused. Set `migration: true` if the user keeps a `pb_migrations` folder,
to get a migration file to commit.

Show the preview and ask before changing anything.

### Step 4: Back up, then apply

Once the user agrees:

1. Call `create_backup` with `resource` (and a `name` such as `before-user-accounts`).
2. Call `apply_collections` with `resource` and `collections`.

`apply_collections` never deletes collections or fields, and refuses to change the type of an existing field.

### Step 5: Check the rules

Run `check_security` and fix any `critical` or `warning` finding with the **review-security** skill.

### Step 6: Types for the app

Call `generate_types` with `resource` (and `collections` to limit it). Tell the user to save the result as a `.ts`
file in their app, for the PocketBase JS SDK.

---

## Rules

- Never apply collections or rules without the user's approval of the previewed change.
- Always back up before `apply_collections`, and tell the user the backup's name.
- If `apply_collections` is not available, the connection is read-only or has no database tools: give the user
  the collection JSON instead, to save as a file and import with `pbc admin collections import <file>` or the
  admin UI's collections import.
