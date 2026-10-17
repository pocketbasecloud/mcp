# Rename and retype, worked

Every path below was run through pbc-mcp's tools against PocketBase 0.40.5 holding 120 records: the data was
counted before and after. Ids such as `tpl_posts`, `tpl_products` and `text724990059` stand for the ones
`get_collection` returns on the user's instance: always use those.

## What PocketBase does

| Change sent to `apply_collections` | Result |
|---|---|
| A new optional field | Applied; existing records have it empty |
| A new **required** field on records that lack it | Applied; then **every edit of an old record fails** ("Cannot be blank") until it is filled |
| A field with its `id` under a new name | Renamed; the data stays |
| A field under a new name **without** its `id` | A new, empty field; the old one and its data stay (fields not listed are kept) |
| A rename, while a rule still names the old field | Refused ("Invalid rule… unknown field"); nothing changes |
| A rename, while an index still names the old field | Refused by pbc-mcp before PocketBase sees it ("rewrite the index in the same request"); the preview shows it under `blocked` |
| A field's type changed | Refused by pbc-mcp before PocketBase sees it |
| A `UNIQUE` index over duplicate values | The preview warns; PocketBase refuses it ("UNIQUE constraint failed"), and **the refused change stays in the running instance** (below) |

**When PocketBase cannot build an index**, the database rolls back, but the running instance keeps the refused
definition until it restarts, and `get_collection` shows it. If the request changed only indexes, records still
save, and the next request that leaves the refused index out applies normally. If it also added or renamed fields,
updating records and changing the collection again fail until a restart (creating records can fail too); a restart
brings the stored definition back with the data intact. Checked on PocketBase 0.40.5, through pbc-mcp and with
PocketBase's own import. A refused rule does none of this.

## Rename `title` to `name` in `posts`

`get_collection` gives the field's id (here `text724990059`) and the rules and indexes that name it. Send the
collection with the field renamed **and** the rule and index rewritten, in one request:

```json
[
  {
    "id": "tpl_posts",
    "name": "posts",
    "type": "base",
    "listRule": "status = 'published' && name != ''",
    "fields": [
      { "id": "text724990059", "name": "name", "type": "text", "required": true, "max": 200 }
    ],
    "indexes": ["CREATE INDEX `idx_posts_name` ON `posts` (`name`)"]
  }
]
```

List the field in full, as `get_collection` returned it (`required`, `max`…): a listed field replaces the stored
one, and options left out go back to their defaults. Other fields can be left out; they are kept. Then: the hooks
and the app code that read `title`, and `generate_types`.

## Make `price` a number in `products` (it is text)

1. **Expand**: add `price_new`, leaving `price` alone; preview, approval, backup, apply.

   ```json
   [{ "id": "tpl_products", "name": "products", "type": "base",
      "fields": [{ "name": "price_new", "type": "number", "onlyInt": true, "min": 0 }] }]
   ```

2. **Copy**, once `price_new` exists: `list_records` with `fields` `id,price`, 50 a page. Show the user how the
   values convert, and list the text that is not a number (`"12,50"`, `"free"`): that is their decision. After their
   approval, for each page, `upsert_records`:

   ```json
   { "collection": "products", "records": [{ "id": "0a5cpq7pf3hhit5", "price_new": 550 }, { "id": "0fwhnbvgqugdbm7", "price_new": 1250 }] }
   ```

3. **Prove**: `count_records` with groups
   `{"copied": "price_new > 0", "missing": "price_new = 0 && price != '' && price != '0'"}`. A number field holds 0
   when empty, so a price written as `"0"` is left out of `missing`; another way of writing zero (`"0.00"`) stays in
   it. Go on only when every record left in `missing` is one the user decided on.

4. **Contract**, after its own approval: `remove_fields` with `fields: ["price"]` (backs up first; the field cannot
   come back through `restore_backup`). Then rename `price_new` to `price` by its id, as above.

The app reads `price_new` between steps 2 and 4 if it must keep working during the change; otherwise plan a short
quiet window.

## Add a unique index on `slug`

1. Duplicates: `list_records` sorted by `slug` with `fields` `id,slug`, page by page; or, for a suspect value,
   `count_records` with `filter` `slug = 'post-3'`. Settle each duplicate with the user.
2. The index alone, with the existing ones:

   ```json
   [{ "id": "tpl_posts", "name": "posts", "type": "base",
      "indexes": ["CREATE INDEX `idx_posts_name` ON `posts` (`name`)", "CREATE UNIQUE INDEX `idx_posts_slug` ON `posts` (`slug`)"] }]
   ```

3. If it is refused anyway, read the error and see the skill's step 6: alone, the index leaves records saving.
