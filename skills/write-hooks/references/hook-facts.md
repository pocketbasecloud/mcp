# Hook facts, measured

Each fact below was run on PocketBase 0.40.5 (a local instance, and PocketBase Cloud for the deploy and log ones)
on 2026-10-17. The API itself comes from `search_docs`; this file holds what the docs leave out or what goes wrong.

## Where code runs

| Fact | What happened |
|---|---|
| Only `*.pb.js` at the top of `pb_hooks` runs | A route in `notpb.js` answered 404; files in `lib/` run only when required |
| A handler cannot see what is declared outside it | A top-level `const` and `function` gave `ReferenceError: … is not defined` inside the handler |
| Shared code goes in `lib/` and is required inside the handler | `require(`${__hooks}/lib/util.js`)` inside the handler worked |
| A `require` of a file that is not on the instance | The request fails with "Invalid module" in the request log |
| `$os.getenv("NAME")` reads an environment variable | Returned the value the process started with |

## Request hooks

| Fact | What happened |
|---|---|
| `e.next()` continues the request | Without it, `onRecordCreateRequest` answered **200 and saved nothing** |
| `throw new BadRequestError("Looks like spam.")` | The client got 400 with that message |
| Any other error (a typo such as `toLowercase`) | The client got 400 "Something went wrong while processing your request."; the request log has status 0 and the error |
| The error's location, e.g. `pb.js:2:54` | Counts from the handler's first line, not the file's |
| A route that returns nothing | 200 with an empty body |

## Deploy and start

| Fact | What happened |
|---|---|
| `deploy_hooks` restarts the instance | `get_logs` showed the container replaced and "Server started" for each deploy |
| New code runs right after the restart | No other step was needed |
| A file with a syntax error | The instance started and its other hooks ran; the file was skipped with `failed to execute <file>: SyntaxError …` in the runtime log |
| A PocketBase backup | Holds `pb_data` only: an overwritten hook file cannot come back from it |
| Removing a file | No MCP tool: `pbc pocketbase hooks rm <file> --name <instance>` (restarts the instance too) |

## Cron

| Fact | What happened |
|---|---|
| `cronAdd("cleanup", "0 3 * * *", () => …)` in a `*.pb.js` | `list_crons` listed `cleanup` beside PocketBase's own jobs |
| `run_cron` | Ran it at once; its `console.log` went to the runtime log (`get_logs`) |

## Shapes that follow from these

```js
/// <reference path="../pb_data/types.d.ts" />

// pb_hooks/comments.pb.js: refuse comments with a link.
onRecordCreateRequest((e) => {
  const { hasLink } = require(`${__hooks}/lib/text.js`);
  if (hasLink(e.record.getString("body"))) {
    throw new BadRequestError("Comments can't contain links.");
  }
  e.next();
}, "comments");
```

```js
// pb_hooks/lib/text.js
module.exports = {
  hasLink: (s) => /https?:\/\/|www\./i.test(s),
};
```

Check the event names, the record methods and the error classes against `search_docs` for the instance's version
before deploying: these shapes show the structure, not an API reference.
