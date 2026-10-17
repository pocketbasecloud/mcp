---
name: review-security
description: "Review the API rules of a PocketBase instance on PocketBase Cloud and fix the risky ones with the user. Use when the user asks whether their PocketBase data is safe, wants a security review or audit, or asks who can read or change their records. Explains each finding in plain words, proposes the exact rule, and changes nothing without approval. Not for a full check before launch: use launch-checklist."
---

# Review the security of a PocketBase instance

## Keywords
security review, audit, api rules, who can read, who can delete, public collection, is my data safe, lock down, permissions, access rules, harden

## Overview

PocketBase decides who may list, view, create, update and delete records through each collection's API rules. A
rule set to `""` lets anyone do it, including people who are not signed in. This skill finds rules that are too
open and fixes them with the user.

**Use this skill when** the user wants to know whether an instance is safe, or asks for a security review.

---

## Workflow

### Step 1: Find the instance

If the user did not name one, call `list_resources` with `kind: "pocketbase"` and ask which instance to review.

### Step 2: Run the review

Call `check_security` with `resource`. Findings come most severe first: `critical`, `warning`, then `info`. Each
finding says how to fix it.

### Step 3: Explain each finding

For every `critical` and `warning` finding:

1. Say in plain words **who could do what today**, for example: "Anyone on the internet, without signing in, can
   delete any post."
2. Propose the **exact rule** that fixes it, and what it allows. Common patterns:
   - Only the owner: `@request.auth.id != "" && owner = @request.auth.id`
   - Any signed-in user may read: `@request.auth.id != ""`
   - Superusers only: `null` (no one through the API except superusers)
3. Mention `info` findings briefly, in one line each.

If a rule needs a field the collection does not have (such as an `owner` relation), say so, and suggest the
**setup-user-accounts** skill instead of a rule that cannot work.

### Step 4: Apply after approval

Ask before changing anything. Once the user agrees, call `update_api_rules` with `resource`, `collection` and
`rules`, an object with only the rules to change (`listRule`, `viewRule`, `createRule`, `updateRule`,
`deleteRule`). In a rule, `""` means anyone and `null` means superusers only.

### Step 5: Check again

Run `check_security` again and show what is left.

---

## Rules

- Never change a rule without the user's approval of that exact rule.
- If `update_api_rules` is not available (a read-only connection, or a connection without the database tools),
  list the fixes so the user can apply them in the admin UI.
- A public read rule can be intended (a blog's published posts). Ask before locking it, and suggest a filter such
  as `published = true` instead of closing it entirely.
- For filter syntax, call `search_docs` with "API rules"; the reference is
  https://pocketbase.io/docs/api-rules-and-filters/.
