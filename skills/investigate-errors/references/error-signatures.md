# What each failure looks like

Measured on PocketBase 0.40.5: each failure was caused on purpose and read back from the request log through
`get_request_logs`. The client's answer often hides the cause; the log's `data.details` and `data.error` name it.
Entries are written a few seconds after the request.

| What the client gets | In the request log | Cause | Confirm with |
|---|---|---|---|
| 400 "Failed to create record." with `data: {"title": …}` | status 400, `details` `{"title": "cannot be blank"}` | A field refused the value: required, `select` value not allowed, `max`, `pattern`, file size or type, a unique index | `get_collection`: the field's options |
| 400 "Failed to create record." with empty `data` | status 400, `details` "create rule failure: sql: no rows in result set" | The `createRule` did not match: not signed in, or the submitted owner is someone else | `get_collection`: the rule; `data.auth` says who asked |
| 400 "Something went wrong while processing your request." | status 400, `details` `invalid left operand "titel" - unknown field "titel"` | A `filter`, `sort` or `expand` names a field the collection does not have | `get_collection` |
| 400 "Something went wrong while processing your request." | **status 0**, level 8, `error` the JS error ("Invalid module", "TypeError: …") | **A hook or route threw** | `list_hooks`; the file and line the error names |
| 400 with the hook's own message | status 400 | A hook refused on purpose (`BadRequestError`) | The message itself |
| 403 "Only superusers can perform this action." | status 403 | The rule for that action is `null` | `get_collection` |
| 404 "The requested resource wasn't found." on one record | status 404, `details` "sql: no rows in result set" | The view, update or delete rule hides it, or the id does not exist | `get_record` (as the superuser: it exists or not) |
| 404 "Missing collection context." | status 404 | No collection by that name in the URL | `list_collections` |
| 200 with no items, or fewer than expected | status 200, **`auth: ""`** | The request ran as a visitor: no token sent, or one PocketBase did not accept, which it ignores rather than refuses | The client's sign-in and the token it sends |
| 200 with no items, signed in | status 200, `auth` "users" | The `listRule` filters the records out | `get_collection`: the rule; `count_records` (the superuser sees all) |
| 401 "The request requires valid record authorization token." | status 401 | An endpoint that needs a signed-in user (`auth-refresh`) | The client's sign-in |

Filters for `get_request_logs`. The tools call the instance as a superuser, so their own requests land in the same
log with `auth` "_superusers"; `data.auth != '_superusers'` leaves them out (checked on PocketBase 0.40.5), and
with them the user's own superuser requests (the admin UI, a backend with a superuser token): drop it to see those.

| To see | Filter |
|---|---|
| Every failed request of the app, including those a hook threw | `level >= 8 && data.auth != '_superusers'` |
| Failures on one collection | `level >= 8 && data.auth != '_superusers' && data.url ~ '/api/collections/posts'` |
| What a list request ran as | `data.method = 'GET' && data.url ~ '/api/collections/posts/records' && data.auth != '_superusers'`, then read `data.auth` |
| Server errors only | `data.status >= 500` (rare; a throwing hook is status 0, not 5xx) |
