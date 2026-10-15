# Contributing

Thanks for your interest in contributing. Pull requests, issues and comments are all welcome.

It helps to know what lives in this repo: the documentation, the portable Agent Plugins package (`plugin.json`,
`mcp.json` and `skills/`), the client-specific manifests (`.mcp.json` and the Claude, Cursor and Gemini plugin
manifests), and the MCP Registry entry (`server.json`). The server itself runs as a hosted service at
`mcp.pocketbasecloud.com` and isn't part of this repo, so changes here are about those public-facing pieces.

## Opening an issue

Use one of the [issue forms](https://github.com/pocketbasecloud/mcp/issues/new/choose). For a security problem,
follow [SECURITY.md](SECURITY.md) instead.

## Sending a pull request

- Keep each pull request focused on one change.
- Match the existing style and structure of the file you're editing.
- If you touch a manifest (`plugin.json`, `mcp.json`, `.mcp.json`, `server.json`, `gemini-extension.json`, or a
  file in `.claude-plugin/` or `.cursor-plugin/`), keep the names, the endpoint, the version and the shared paths
  aligned across all of them.
- A skill must use only tools the server offers, and wait for the user's approval before any step that changes
  something.
- Run `npm test` and `npm run validate` before you push. They need Node.js 20 or later and no dependencies, and
  check that every manifest parses, points at the same endpoint, and that every skill has valid metadata.

## Releasing

See [docs/publishing.md](docs/publishing.md) for bumping the version and publishing to the MCP Registry.
