# Template data models

Generated from pocketbasecloud/templates at 7af8367 by `npm run references`; do not edit by hand.
Every rule and unique index below is covered by a check that ran on PocketBase 0.40.5: each
template was imported into a fresh instance and its checks run as a visitor, two members and an admin.
Use them as worked examples of fields, relations, rules and indexes, not as a schema to import whole.

## Base (`base`)

Every template starts from these: users with a role that members cannot give themselves, and media files each member owns.

### users (`_pb_users_auth_`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text |  | max 255 |
| avatar | file |  | one file, jpeg/png/svg+xml/gif/webp |
| role | select |  | member \| admin |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view, delete: `id = @request.auth.id`
- create: `@request.body.role:isset = false`
- update: `id = @request.auth.id && @request.body.role:changed = false`

### media (`tpl_media`)

| Field | Type | Required | Options |
|---|---|---|---|
| file | file | yes | one file, ≤ 10 MB, jpeg/png/webp/gif/pdf, thumbs 100x100, 640x0, protected (needs a file token) |
| owner | relation | yes | → users, cascade delete |
| alt | text |  | max 200 |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view, delete: `owner = @request.auth.id`
- create: `@request.auth.id != '' && owner = @request.auth.id`
- update: `owner = @request.auth.id && @request.body.owner:changed = false`

Indexes:
- `` CREATE INDEX `idx_media_owner` ON `media` (`owner`, `created`) ``

What the checks proved:
- allowed: a visitor can sign up
- refused: a visitor cannot sign up as an admin
- refused: a member cannot make themselves an admin
- allowed: a member can change their own name
- allowed: a member can save their profile with their role as it is
- refused: a member cannot read another member
- allowed: a member lists only themselves
- refused: a member cannot delete another member
- allowed: a member uploads a file of their own
- refused: another member cannot see it
- allowed: a visitor lists no files
- refused: a member cannot upload a file as someone else
- refused: a member cannot give their file to someone else
- refused: another member cannot delete it
- allowed: the owner can delete it

## Blog (`blog`)

Posts with tags and comments: anyone reads published posts, admins write; signed-in members comment on published posts; hidden comments stay visible only to their author and admins.

Modules: auth, storage.

### tags (`tpl_tags`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text | yes | max 60 |
| slug | text | yes | max 60, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

Rules:
- list, view: everyone (empty rule)
- create, update, delete: `@request.auth.role = 'admin'`

Indexes:
- `` CREATE UNIQUE INDEX `idx_tags_slug` ON `tags` (`slug`) ``

### posts (`tpl_posts`)

| Field | Type | Required | Options |
|---|---|---|---|
| title | text | yes | max 200 |
| slug | text | yes | max 120, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| excerpt | text |  | max 300 |
| body | editor |  |  |
| cover | file |  | one file, ≤ 5 MB, jpeg/png/webp, thumbs 640x360, 1280x0 |
| author | relation | yes | → users |
| tags | relation |  | → tags, up to 10 |
| status | select | yes | draft \| published |
| published_at | date |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `status = 'published' || @request.auth.role = 'admin'`
- create: `@request.auth.role = 'admin' && author = @request.auth.id`
- update, delete: `@request.auth.role = 'admin'`

Indexes:
- `` CREATE UNIQUE INDEX `idx_posts_slug` ON `posts` (`slug`) ``
- `` CREATE INDEX `idx_posts_published` ON `posts` (`status`, `published_at`) ``

### comments (`tpl_comments`)

| Field | Type | Required | Options |
|---|---|---|---|
| post | relation | yes | → posts, cascade delete |
| author | relation | yes | → users, cascade delete |
| body | text | yes | max 2000 |
| hidden | bool |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `post.status = 'published' && (hidden = false || author = @request.auth.id || @request.auth.role = 'admin')`
- create: `@request.auth.id != '' && author = @request.auth.id && post.status = 'published' && @request.body.hidden:isset = false`
- update: `(author = @request.auth.id && @request.body.post:changed = false && @request.body.author:changed = false && @request.body.hidden:changed = false) || @request.auth.role = 'admin'`
- delete: `author = @request.auth.id || @request.auth.role = 'admin'`

Indexes:
- `` CREATE INDEX `idx_comments_post` ON `comments` (`post`, `created`) ``

What the checks proved:
- allowed: an admin adds a tag
- refused: a member cannot add tags
- refused: a tag slug cannot repeat
- allowed: a visitor lists the tags
- allowed: a visitor opens a tag
- refused: a member cannot rename a tag
- refused: a member cannot delete a tag
- allowed: an admin publishes a post
- allowed: an admin keeps a draft
- refused: a slug cannot repeat
- refused: a member cannot write posts
- refused: an admin cannot post as someone else
- allowed: a visitor reads only published posts
- refused: a visitor cannot open a draft
- refused: a member cannot edit a post
- refused: a member cannot delete a post
- allowed: a member comments on a published post
- refused: a member cannot comment on a draft
- refused: a member cannot comment as someone else
- refused: a visitor cannot comment
- allowed: an admin hides a comment
- refused: the author cannot unhide it
- allowed: a visitor does not see a hidden comment
- refused: a visitor cannot open a hidden comment
- allowed: its author still sees it
- refused: another member cannot edit it
- refused: another member cannot delete it

## Booking (`booking`)

Services anyone can browse, booked by signed-in customers; a slot is taken once, customers can only cancel, staff (role admin) confirm.

Modules: auth, realtime, cron, resend.

### services (`tpl_services`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text | yes | max 120 |
| description | text |  | max 2000 |
| duration_minutes | number | yes | min 5, max 600, integers only |
| price | number |  | min 0, integers only |
| active | bool |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `active = true || @request.auth.role = 'admin'`
- create, update, delete: `@request.auth.role = 'admin'`

### bookings (`tpl_bookings`)

| Field | Type | Required | Options |
|---|---|---|---|
| service | relation | yes | → services |
| customer | relation | yes | → users, cascade delete |
| starts_at | date | yes |  |
| status | select | yes | requested \| confirmed \| cancelled |
| note | text |  | max 500 |
| reminded | bool |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `customer = @request.auth.id || @request.auth.role = 'admin'`
- create: `@request.auth.id != '' && customer = @request.auth.id && status = 'requested' && service.active = true && @request.body.reminded:isset = false`
- update: `(customer = @request.auth.id && @request.body.customer:changed = false && @request.body.service:changed = false && @request.body.starts_at:changed = false && @request.body.reminded:changed = false && (@request.body.status:changed = false || @request.body.status = 'cancelled')) || @request.auth.role = 'admin'`
- delete: superusers only (null)

Indexes:
- `` CREATE UNIQUE INDEX `idx_bookings_slot` ON `bookings` (`service`, `starts_at`) WHERE `status` != 'cancelled' ``
- `` CREATE INDEX `idx_bookings_customer` ON `bookings` (`customer`, `starts_at`) ``

What the checks proved:
- allowed: staff add a service
- allowed: staff add a service that is not offered yet
- refused: a member cannot add services
- allowed: a visitor sees only offered services
- refused: a visitor cannot open a service that is not offered
- refused: a member cannot change a service
- refused: a member cannot delete a service
- refused: a visitor cannot book
- allowed: a member books a slot
- refused: a member cannot book a service that is not offered
- refused: a member cannot book a confirmed slot for themselves
- refused: a member cannot book for someone else
- refused: a taken slot cannot be booked again
- refused: another member cannot see the booking
- allowed: another member lists none of it
- refused: a customer cannot confirm their own booking
- refused: a customer cannot move their booking
- allowed: a customer can resave their booking with its slot as it is
- allowed: a customer cancels
- allowed: a cancelled slot can be booked again
- allowed: staff confirm a booking
- allowed: staff see every booking
- refused: nobody deletes a booking; it is cancelled instead

## CRM (`crm`)

Companies, contacts and activities that each member owns; admins see everything; a contact or activity can only point at records its owner owns.

Modules: auth.

### companies (`tpl_companies`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text | yes | max 200 |
| website | url |  |  |
| owner | relation | yes | → users |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view, delete: `owner = @request.auth.id || @request.auth.role = 'admin'`
- create: `@request.auth.id != '' && owner = @request.auth.id`
- update: `(owner = @request.auth.id && @request.body.owner:changed = false) || @request.auth.role = 'admin'`

Indexes:
- `` CREATE INDEX `idx_companies_owner` ON `companies` (`owner`, `name`) ``

### contacts (`tpl_contacts`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text | yes | max 200 |
| email | email |  |  |
| phone | text |  | max 40 |
| company | relation |  | → companies |
| owner | relation | yes | → users |
| tags | select |  | lead \| customer \| partner \| vip, up to 4 |
| notes | editor |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view, delete: `owner = @request.auth.id || @request.auth.role = 'admin'`
- create: `@request.auth.id != '' && owner = @request.auth.id && (company = '' || company.owner = @request.auth.id)`
- update: `(owner = @request.auth.id && @request.body.owner:changed = false && (@request.body.company:changed = false || @request.body.company = '' || @request.body.company.owner = @request.auth.id)) || @request.auth.role = 'admin'`

Indexes:
- `` CREATE INDEX `idx_contacts_owner` ON `contacts` (`owner`, `name`) ``
- `` CREATE INDEX `idx_contacts_email` ON `contacts` (`email`) ``

### activities (`tpl_activities`)

| Field | Type | Required | Options |
|---|---|---|---|
| contact | relation | yes | → contacts, cascade delete |
| kind | select | yes | call \| email \| meeting \| note |
| happened_at | date | yes |  |
| summary | text | yes | max 2000 |
| owner | relation | yes | → users |
| created | autodate |  | set on create |

Rules:
- list, view: `owner = @request.auth.id || @request.auth.role = 'admin'`
- create: `@request.auth.id != '' && owner = @request.auth.id && contact.owner = @request.auth.id`
- update: `owner = @request.auth.id && @request.body.owner:changed = false && @request.body.contact:changed = false`
- delete: `owner = @request.auth.id`

Indexes:
- `` CREATE INDEX `idx_activities_contact` ON `activities` (`contact`, `happened_at`) ``

What the checks proved:
- allowed: a member adds a company
- refused: a member cannot add a company for someone else
- allowed: a member adds a contact at their company
- refused: a member cannot file a contact under someone else's company
- allowed: a member adds a contact with no company
- refused: a member cannot move their contact to someone else's company
- allowed: a member logs a call with their contact
- refused: a member cannot log activity on someone else's contact
- allowed: another member lists none of the companies
- refused: another member cannot open the company
- refused: another member cannot rename it
- refused: another member cannot delete it
- refused: another member cannot delete the contact
- allowed: another member lists none of the activities
- refused: another member cannot open the call
- refused: another member cannot rewrite it
- refused: another member cannot delete it either
- allowed: another member sees none of it
- refused: another member cannot open the contact
- refused: an owner cannot hand a contact to someone else
- allowed: an admin sees every contact
- allowed: an admin reassigns a contact
- allowed: deleting a contact deletes its activities
- refused: the activity went with it

## Internal dashboard (`dashboard`)

Reports a cron job writes for each period; only admins read them, and a period is written once.

Modules: auth, cron.

### reports (`tpl_reports`)

| Field | Type | Required | Options |
|---|---|---|---|
| kind | select | yes | daily \| weekly \| monthly |
| period_start | date | yes |  |
| period_end | date | yes |  |
| metrics | json | yes | ≤ 195 KB |
| created | autodate |  | set on create |

Rules:
- list, view: `@request.auth.role = 'admin'`
- create, update, delete: superusers only (null)

Indexes:
- `` CREATE UNIQUE INDEX `idx_reports_period` ON `reports` (`kind`, `period_start`) ``

What the checks proved:
- allowed: the cron job (superuser) writes a daily report
- refused: a period is written once
- allowed: an admin reads the reports
- allowed: a member sees no reports
- refused: a member cannot open one
- refused: a member cannot change one
- refused: a member cannot delete one
- allowed: a visitor sees no reports
- refused: not even an admin writes a report by hand

## Shop (`shop`)

Products anyone can browse and staff manage; orders and Stripe events written only by the server (checkout hook and webhook), each customer reading their own orders.

Modules: auth, storage, stripe, resend.

### products (`tpl_products`)

| Field | Type | Required | Options |
|---|---|---|---|
| name | text | yes | max 200 |
| slug | text | yes | max 120, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| description | editor |  |  |
| price | number | yes | min 1, integers only |
| currency | text | yes | min 3, max 3, pattern `^[a-z]{3}$` |
| images | file |  | up to 6 files, ≤ 5 MB, jpeg/png/webp, thumbs 400x400, 1200x0 |
| stock | number |  | min 0, integers only |
| active | bool |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `active = true || @request.auth.role = 'admin'`
- create, update, delete: `@request.auth.role = 'admin'`

Indexes:
- `` CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`) ``

### orders (`tpl_orders`)

| Field | Type | Required | Options |
|---|---|---|---|
| customer | relation |  | → users |
| email | email | yes |  |
| items | json | yes | ≤ 98 KB |
| total | number | yes | min 1, integers only |
| currency | text | yes | min 3, max 3, pattern `^[a-z]{3}$` |
| status | select | yes | pending \| paid \| failed \| refunded |
| stripe_session | text |  | max 255 |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view: `customer = @request.auth.id || @request.auth.role = 'admin'`
- create, update, delete: superusers only (null)

Indexes:
- `` CREATE UNIQUE INDEX `idx_orders_stripe_session` ON `orders` (`stripe_session`) WHERE `stripe_session` != '' ``
- `` CREATE INDEX `idx_orders_customer` ON `orders` (`customer`, `created`) ``

### stripe_events (`tpl_stripe_events`)

| Field | Type | Required | Options |
|---|---|---|---|
| event_id | text | yes | max 255 |
| type | text | yes | max 120 |
| payload | json |  | ≤ 977 KB |
| processed_at | date |  |  |
| created | autodate |  | set on create |

Rules:
- list, view, create, update, delete: superusers only (null)

Indexes:
- `` CREATE UNIQUE INDEX `idx_stripe_events_event_id` ON `stripe_events` (`event_id`) ``

What the checks proved:
- allowed: staff add a product
- allowed: staff add a product not on sale yet
- refused: a price of 0 is refused, since a required number cannot be 0
- refused: a slug cannot repeat
- refused: a member cannot add products
- allowed: a visitor sees only products on sale
- refused: a visitor cannot open a product not on sale
- refused: a member cannot change a price
- refused: a member cannot delete a product
- refused: a member cannot write an order themselves
- allowed: the server (superuser) records an order
- refused: a Checkout Session is recorded once
- allowed: the customer reads their order
- refused: another member cannot
- allowed: another member lists no orders
- refused: a customer cannot mark their order paid
- refused: a customer cannot delete their order
- allowed: the webhook (superuser) stores an event
- refused: the same event is stored once
- refused: nobody else reads Stripe events, not even staff
- refused: nobody else opens one
- refused: a visitor cannot forge one
- refused: nobody else changes one
- refused: nobody else deletes one

## Waitlist (`waitlist`)

A public sign-up form whose list only the team reads; visitors cannot set their own status.

Modules: auth, resend.

### signups (`tpl_signups`)

| Field | Type | Required | Options |
|---|---|---|---|
| email | email | yes |  |
| name | text |  | max 120 |
| source | text |  | max 200 |
| status | select |  | pending \| invited \| joined |
| invited_at | date |  |  |
| created | autodate |  | set on create |
| updated | autodate |  | set on create and update |

Rules:
- list, view, update, delete: superusers only (null)
- create: `@request.body.status:isset = false && @request.body.invited_at:isset = false`

Indexes:
- `` CREATE UNIQUE INDEX `idx_signups_email` ON `signups` (`email`) ``

What the checks proved:
- allowed: a visitor joins the waitlist
- refused: a visitor cannot invite themselves
- refused: the same email cannot join twice
- refused: a visitor cannot read the list
- refused: a member cannot read the list
- refused: a visitor cannot open a sign-up
- refused: nobody but the team changes a sign-up
- refused: nobody but the team deletes a sign-up
- allowed: the team (superuser) reads the list
