# Field types and their options

PocketBase 0.40.5, read back from a collection holding one field of each type. Every field also takes `name`,
`type`, `required`, `hidden`, `presentable` and `help` (a hint shown in the admin UI). A type not listed here
(`integer`, `string`, `varchar`…) is refused.

| Type | Options (default) | Use it for |
|---|---|---|
| `text` | `min` (0), `max` (0 = PocketBase's limit), `pattern` (regex), `autogeneratePattern` | Names, titles, slugs (with a `pattern`), short codes |
| `editor` | `maxSize` (0 = default), `convertURLs` (false) | Rich text written in the admin UI or an editor; it is HTML |
| `number` | `min`, `max` (null = no bound), `onlyInt` (false) | Quantities and money; money as an integer in the smallest unit (`onlyInt`, cents) |
| `bool` | none | Flags such as `active`, `published` |
| `email` | `onlyDomains`, `exceptDomains` ([]) | Email addresses outside an auth collection |
| `url` | `onlyDomains`, `exceptDomains` ([]) | Links |
| `date` | `min`, `max` ("" = no bound) | Times chosen by people (`starts_at`), stored in UTC |
| `autodate` | `onCreate`, `onUpdate` | `created` (on create) and `updated` (on create and update); a new collection does not get them unless listed |
| `select` | `values`, `maxSelect` (0 or 1 = one value) | A fixed set: status, kind, tags that rarely change |
| `file` | `maxSelect` (one file), `maxSize` (0 = default), `mimeTypes` ([] = any), `thumbs` (e.g. `100x100`, `640x0`), `protected` (false) | Images and documents; `protected` files need a file token to download |
| `relation` | `collectionId`, `maxSelect` (one), `minSelect` (0), `cascadeDelete` (false) | A link to records of another collection, by its **id** |
| `json` | `maxSize` (0 = default) | Data with no fixed shape: a snapshot of an order's items, a webhook payload, report figures |
| `geoPoint` | none | A longitude and latitude |

## What `required` means for each type

Checked on PocketBase 0.40.5 (each refused with "Cannot be blank."):

| Type | A required field refuses |
|---|---|
| `number` | **0** |
| `bool` | **false**: a required bool must be true (an "I accept" box) |
| `json` | **`{}` and `[]`** |
| `text`, `email`, `url`, `editor`, `select`, `date` | an empty value |
| `relation`, `file` | no record, no file |

So a number that may be 0 (a free item, a count that starts at 0) or a flag that may be false is not `required`.
State a lower bound with `min` instead: `min: 1` when 0 is not allowed says so; `required` with `min: 0` looks as if
0 were allowed and is not.

## Choosing

- **`select` over `text`** when the values are a known set the app branches on (`requested | confirmed | cancelled`).
  Use a separate collection with a `relation` instead when the set is edited by users (tags on a blog).
- **`relation` over an id in `text`**: PocketBase checks it, expands it, and `cascadeDelete` can clean up children.
  Turn `cascadeDelete` on only when the child must not outlive its parent (a booking's customer, a comment's post),
  and say so.
- **`autodate`** for `created` and `updated`, never a `date` the client fills in.
- **`number` with `onlyInt`** for money and counts; floats round.
- **`json`** only when the shape really varies; a field the app filters or sorts on belongs in its own column.
- **`users` already has `name` and `avatar`** on a new instance; add only what the app needs (`role`, `bio`).
