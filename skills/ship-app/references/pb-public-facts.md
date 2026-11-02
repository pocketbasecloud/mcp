# pb_public facts, measured

Run through pbc-mcp's `deploy_public` (the tool `write_cloud_files` and `deploy_resource` replaced) on PocketBase
Cloud (PocketBase 0.40.4) on 2026-10-17, and read from the platform's deploy documentation where noted. Rows marked
*(tool)* come from the descriptions of pbc-mcp's current tools (2026-11-02).

| Fact | What happened |
|---|---|
| `write_cloud_files` keeps what it is not sent *(tool)* | Files not named stay as they are; files with the same path are overwritten; only the paths in `delete` are removed, and deleting needs `confirm: true` |
| `deploy_resource` replaces the folders it is sent *(tool)* | Each of `pb_hooks` and `pb_public` sent replaces that folder (its files not sent are removed); `pb_migrations` is merged; folders not sent stay. Replacing needs `confirm: true` |
| A full replace removes what it was not sent | A second deploy with only `index.html` removed `css/app.css` and `img/dot.png` |
| What is there can be read *(tool)* | `list_cloud_files` lists `pb_public` (`glob` for any depth), `read_cloud_file` reads one file, `download_cloud_files` zips them all |
| Each change is a revision *(tool)* | Live at once as one revision and one deployment; `restore_revision` with the number before it undoes it. Nothing is pushed to GitHub unless the user asks (`push_to_github`) |
| Hooks and migrations are kept | A route in `pb_hooks` answered before and after a `pb_public` deploy |
| No restart | No new "Server started" in `get_logs` during either deploy; only hook changes restart the instance *(tool)* |
| Content types follow the extension | `.html` text/html, `.css` text/css, a base64 `.png` image/png |
| Every unknown path answers `index.html` with 200 | `/some/app/route`, and also `/nope.css`: a missing asset never gives a 404 |
| Limits *(tool)* | `write_cloud_files`: 100 files, 1,000,000 characters each and 4,000,000 in all per call, paths of at most 255 characters. `deploy_resource`: 500 files and 4,000,000 characters. Bigger files through `create_upload_link`, up to the plan's per-file limit (Free 1 MB, Starter and Pro 100 MB) |
| Refused in `pb_public` *(tool)* | `.env` files, anything in `.git`, and a `package.json` whose start script runs a server: that is a backend, deployed from the portal |
| `pbc pocketbase deploy` from a folder | Sends `pb_public`, `pb_hooks` and `pb_migrations` found there in one archive; `pb_public` is replaced (platform docs) |
