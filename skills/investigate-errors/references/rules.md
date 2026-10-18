# API rules cookbook

A rule is a PocketBase filter, evaluated per record: `null` allows superusers only, `""` allows everyone, anything
else must be true for the request. Each pattern below is used in the templates of the `design-collections` skill
and covered there by checks that ran on PocketBase 0.40.5: each rule was also opened or locked on purpose, and a
check failed every time.

## What a refusal looks like

| Rule fails on | Answer |
|---|---|
| list | 200 with only the records that pass: a list rule is a filter |
| view, update, delete | 404 |
| create | 400 |
| any action whose rule is `null` | 403 |

So "my list comes back empty" is usually a list rule, and an "empty" list is not a broken query.

## Patterns

| Who | Rule | Template |
|---|---|---|
| Superusers only (the server: hooks, webhooks, cron) | `null` | `shop.stripe_events`, `dashboard.reports` writes |
| Everyone | `""`, for data meant to be public: `preview_collections` warns and `check_security` reports a public list as a warning, which is expected here | `blog.tags` list, view |
| Everyone, filtered | `status = 'published'`, `active = true` | `blog.posts`, `booking.services` |
| Signed-in users | `@request.auth.id != ''` | creates in `crm`, `blog.comments` |
| The owner | `owner = @request.auth.id` | `base.media`, `crm.*` |
| Staff | `@request.auth.role = 'admin'` (only with the `role` guard below) | `booking`, `shop`, `blog` |
| Owner or staff | `owner = @request.auth.id \|\| @request.auth.role = 'admin'` | `crm.*` list, view |

## Guards

| To | Rule | Template |
|---|---|---|
| Create only as yourself | create: `@request.auth.id != '' && owner = @request.auth.id` (`owner` is the submitted value) | `base.media` |
| Never hand a record to someone else | update: `@request.body.owner:changed = false` | `base.media`, `crm.*` |
| Keep a field only the server sets | create: `@request.body.x:isset = false`; update: `@request.body.x:changed = false` | `waitlist.signups`, `booking.bookings` |
| Keep `role` out of users' hands | users create: `@request.body.role:isset = false`; update: `id = @request.auth.id && @request.body.role:changed = false` | `base.users` |
| Allow one change only | `(@request.body.status:changed = false \|\| @request.body.status = 'cancelled')` | `booking.bookings` |
| Point only at records you own | `company = '' \|\| company.owner = @request.auth.id`; on update `@request.body.company.owner = @request.auth.id` | `crm.contacts` |
| Follow a relation | `post.status = 'published'`, `service.active = true` | `blog.comments`, `booking.bookings` |
| Hide without deleting | `hidden = false \|\| author = @request.auth.id \|\| @request.auth.role = 'admin'` | `blog.comments` |

`:changed = false` is, in PocketBase's words, `(@request.body.x:isset = false || @request.body.x = x)`: a form that
sends the whole record back still saves, which `:isset = false` would refuse. Use `:isset` on create, where there
is nothing stored to compare with.

## Mistakes these templates were checked against

- **A `role` without its guard.** Users can update their own record by default, so a `role` field nobody guards
  lets anyone make themselves an admin.
- **`""` where `null` was meant.** `""` is public; `null` is superusers only. They are opposites.
- **Checking the owner on create but not on update.** The record can then be handed to someone else.
- **`@request.data`**: replaced by `@request.body` in PocketBase 0.23.
- **A uniqueness that should ignore some records** (a cancelled booking frees its slot) needs a partial index,
  `CREATE UNIQUE INDEX … WHERE status != 'cancelled'`, not a rule.
