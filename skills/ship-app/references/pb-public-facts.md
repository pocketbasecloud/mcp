# pb_public facts, measured

Run through pbc-mcp's `deploy_public` on PocketBase Cloud (PocketBase 0.40.4) on 2026-10-17, and read from the
platform's deploy documentation where noted.

| Fact | What happened |
|---|---|
| A deploy is a deployment | `deploy_public` answered `queued`; `get_deployment` showed `success` a few seconds later |
| It replaces the whole directory | A second deploy with only `index.html` removed `css/app.css` and `img/dot.png` |
| Nothing reads the current files | No tool lists or downloads `pb_public`; the platform keeps the upload but offers no way back to it |
| It cannot empty the directory | `deploy_public` needs at least one file |
| Hooks and migrations are kept | A route in `pb_hooks` answered before and after; the platform documents `pb_hooks` and `pb_migrations` as merged, `pb_public` as replaced |
| No restart | No new "Server started" in `get_logs` during either deploy (`deploy_hooks` does restart) |
| Content types follow the extension | `.html` text/html, `.css` text/css, a base64 `.png` image/png |
| Every unknown path answers `index.html` with 200 | `/some/app/route`, and also `/nope.css`: a missing asset never gives a 404 |
| Limits | 100 files, 300,000 characters each, 1,000,000 in all, paths of at most 8 levels and 255 characters (pbc-mcp); larger sites go through `pbc pocketbase deploy` |
| `pbc pocketbase deploy` from a folder | Sends `pb_public`, `pb_hooks` and `pb_migrations` found there in one archive, with the same rules (platform docs) |
