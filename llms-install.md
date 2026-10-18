# Installing the PocketBase Cloud MCP server

For an AI agent (such as Cline) setting this server up for a user. The server is remote: there is nothing to clone,
build or run, and no API key to ask for.

## 1. Add the server

Add this entry to the MCP settings file (for Cline: MCP Servers → Remote Servers → Edit Configuration, which opens
`cline_mcp_settings.json`). Keep any servers already in the file.

```json
{
  "mcpServers": {
    "pocketbasecloud": {
      "type": "streamableHttp",
      "url": "https://mcp.pocketbasecloud.com/mcp"
    }
  }
}
```

## 2. Sign in

The server uses OAuth 2.1 (dynamic client registration, PKCE). The first connection opens the PocketBase Cloud
portal in the browser. The user signs in, chooses **Read and write** or **Read only**, and all projects or one, then
allows access. Nothing else needs to be configured.

The user needs a PocketBase Cloud account (https://pocketbasecloud.com). Don't ask for a password or a token:
signing in happens only in the browser.

## 3. Check it works

Call `get_overview`. It lists the user's projects, PocketBase instances, frontends and backends with their status.
A read-only connection offers only the tools that read.

## Optional

- **Scripts and CI** can skip the browser by sending a PocketBase Cloud CLI access token as
  `Authorization: Bearer <token>`. The user creates it in the portal under Account → CLI access token. Put it in the
  `headers` of the entry above, never in a file that is committed.
- **More tools:** add `?features=` to the URL to choose tool groups. The default is
  `account,resources,deploy,domains,database,docs`; `env` and `database_admin` are opt-in.
- **Troubleshooting:** see the Troubleshooting section of README.md.
