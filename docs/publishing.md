# Publishing

How a change in this repository reaches each place that lists the PocketBase Cloud MCP Server.

## Versions

Every manifest carries a `version`: `server.json`, `plugin.json`, `.claude-plugin/plugin.json`,
`.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json` and `gemini-extension.json`. Bump them together;
`npm run validate` fails when they differ. The MCP Registry refuses a version it already has.

## MCP Registry

The entry is [`server.json`](../server.json), named `com.pocketbasecloud/mcp`. A name under `com.pocketbasecloud`
must be proven with the `pocketbasecloud.com` domain, once per login, by DNS or by HTTP.

The Registry holds only this metadata (name, description, server URL, links, version), not the server's tools, so a
deploy of the server needs no new entry. Publish again when the metadata changes, with a new version: a published
version can't be changed.

### Release (automatic)

Bump the version in every manifest, commit and push, then push a tag with the same version:

```sh
git tag v1.1.0 && git push origin v1.1.0
```

[`publish.yml`](../.github/workflows/publish.yml) checks the manifests, refuses a tag that differs from
`server.json`'s version, installs a pinned `mcp-publisher` after checking its checksum, signs in by DNS with the
`MCP_PRIVATE_KEY` secret, and publishes.

The secret holds the key's private part in hex, the same string step 3 below computes. Set it from the key without
printing it:

```sh
openssl pkey -in key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n' \
  | gh secret set MCP_PRIVATE_KEY -R pocketbasecloud/mcp
```

### Set up, or publish by hand

1. **Create a key** (OpenSSL 3; on macOS use Homebrew's `openssl`, since the system LibreSSL lacks Ed25519):

   ```sh
   openssl genpkey -algorithm Ed25519 -out key.pem
   PUBLIC_KEY="$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
   ```

   Keep `key.pem` out of git (`.gitignore` already does) and somewhere only maintainers can read.

2. **Prove the domain**, with one of:

   - **DNS:** a TXT record on the apex `pocketbasecloud.com` (not a subdomain or selector) with the value
     `v=MCPv1; k=ed25519; p=<PUBLIC_KEY>`.
   - **HTTP:** serve that same line as plain text at `https://pocketbasecloud.com/.well-known/mcp-registry-auth`.

3. **Log in and publish** with [`mcp-publisher`](https://github.com/modelcontextprotocol/registry):

   ```sh
   PRIVATE_KEY="$(openssl pkey -in key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')"
   mcp-publisher login dns --domain pocketbasecloud.com --private-key "$PRIVATE_KEY"   # or: login http
   mcp-publisher publish
   ```

The Registry checks the domain, not the server URL, and one remote URL can belong to only one server name.

## Claude Code

Users add this repository as a marketplace (`/plugin marketplace add pocketbasecloud/mcp`) and install
`pocketbase-cloud` from it. A pushed change reaches them when they update the marketplace; nothing else to publish.

## Cursor

The Cursor Marketplace reads `.cursor-plugin/plugin.json`. Submit the repository once through Cursor's marketplace
process. Cursor reviews every update by hand before it reaches the marketplace, so a release is listed there only
after that review: plan for it with each version.

## Gemini CLI

Users install with `gemini extensions install https://github.com/pocketbasecloud/mcp`; `gemini-extension.json` is
read from the repository.

## Claude and ChatGPT directories

These listings are not built from this repository. Their texts and packages live in the server's own repository
and are submitted through each directory's portal.
