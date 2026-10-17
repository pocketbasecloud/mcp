# Collection definitions for preview_collections and apply_collections

The same JSON as the admin UI's import: an array of collections. `preview_collections` shows what it would change
(with `migration: true`, also a `pb_migrations/` file to commit); `apply_collections` applies it, up to 20
collections per call.

## A collection

| Key | Value |
|---|---|
| `id` | Give every **new** collection one (short, lowercase, e.g. `tpl_bookings`), so a relation in the same request can name it. An existing collection keeps the id `get_collection` shows; the default `users` is `_pb_users_auth_`. |
| `name` | What the API calls it: `/api/collections/<name>/records` |
| `type` | `base`; `auth` for a collection people sign in to; `view` for a read-only SQL view |
| `listRule` … `deleteRule` | See `rules.md`. Leave one out and a new collection gets `null` (superusers only). |
| `fields` | The fields, each `{ "name", "type", "required", …its options }` (see `field-types.md`) |
| `indexes` | Raw SQL. A partial index (`… WHERE status != 'cancelled'`) is allowed. |

## What apply_collections does with it

- **Collections and fields not listed are left alone**; nothing is ever deleted (`remove_fields` and
  `delete_collection` do that).
- **A listed field replaces the stored one whole**: options it leaves out go back to their defaults, and the preview
  lists them. Change a field by sending it **in full, with the `id` `get_collection` gave it**; with its id it can also
  be renamed and keep its data.
- **A field's type cannot change**; that is a `change-schema` job.
- **A relation's `collectionId` must be a collection id**, of an existing collection or of one created in the same
  request; a name, or an id nothing has, is refused.
- **`indexes`, when listed, replace the collection's indexes**: list the ones to keep too.

## When apply_collections is refused

A refused rule or field changes nothing, and pbc-mcp refuses an index naming a field the collection would not have
before PocketBase sees it. When PocketBase itself cannot build an index (a `UNIQUE` over duplicate values), the
database is unchanged but the running instance keeps the refused change until it restarts: alone, records still
save; with added or renamed fields, updating records and further changes fail until a restart (checked on PocketBase
0.40.5). The error says which; see the `change-schema` skill's step 5.

## A full example

The `booking` template (see `templates.md`): services anyone can browse and staff manage, bookings a signed-in
customer makes for one service, a slot taken once until it is cancelled. `bookings.service` names `tpl_services`,
created in the same request; `bookings.customer` names `users` by its id.

```json
[
  {
    "id": "tpl_services",
    "name": "services",
    "type": "base",
    "listRule": "active = true || @request.auth.role = 'admin'",
    "viewRule": "active = true || @request.auth.role = 'admin'",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "fields": [
      {
        "name": "name",
        "type": "text",
        "required": true,
        "max": 120
      },
      {
        "name": "description",
        "type": "text",
        "max": 2000
      },
      {
        "name": "duration_minutes",
        "type": "number",
        "required": true,
        "min": 5,
        "max": 600,
        "onlyInt": true
      },
      {
        "name": "price",
        "type": "number",
        "min": 0,
        "onlyInt": true
      },
      {
        "name": "active",
        "type": "bool"
      },
      {
        "name": "created",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": false
      },
      {
        "name": "updated",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": true
      }
    ]
  },
  {
    "id": "tpl_bookings",
    "name": "bookings",
    "type": "base",
    "listRule": "customer = @request.auth.id || @request.auth.role = 'admin'",
    "viewRule": "customer = @request.auth.id || @request.auth.role = 'admin'",
    "createRule": "@request.auth.id != '' && customer = @request.auth.id && status = 'requested' && service.active = true && @request.body.reminded:isset = false",
    "updateRule": "(customer = @request.auth.id && @request.body.customer:changed = false && @request.body.service:changed = false && @request.body.starts_at:changed = false && @request.body.reminded:changed = false && (@request.body.status:changed = false || @request.body.status = 'cancelled')) || @request.auth.role = 'admin'",
    "deleteRule": null,
    "fields": [
      {
        "name": "service",
        "type": "relation",
        "required": true,
        "collectionId": "tpl_services",
        "maxSelect": 1,
        "cascadeDelete": false
      },
      {
        "name": "customer",
        "type": "relation",
        "required": true,
        "collectionId": "_pb_users_auth_",
        "maxSelect": 1,
        "cascadeDelete": true
      },
      {
        "name": "starts_at",
        "type": "date",
        "required": true
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "maxSelect": 1,
        "values": [
          "requested",
          "confirmed",
          "cancelled"
        ]
      },
      {
        "name": "note",
        "type": "text",
        "max": 500
      },
      {
        "name": "reminded",
        "type": "bool"
      },
      {
        "name": "created",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": false
      },
      {
        "name": "updated",
        "type": "autodate",
        "onCreate": true,
        "onUpdate": true
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_bookings_slot` ON `bookings` (`service`, `starts_at`) WHERE `status` != 'cancelled'",
      "CREATE INDEX `idx_bookings_customer` ON `bookings` (`customer`, `starts_at`)"
    ]
  }
]
```
