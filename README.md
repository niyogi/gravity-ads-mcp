# gravity-ads-mcp

Local MCP server for the [Gravity](https://trygravity.ai) advertiser dashboard API. Create, edit, pause, and archive campaigns — and pull all your reporting — from any MCP-capable agent without your API key leaving your machine.

Gravity exposes a hosted MCP server at `https://platform.trygravity.ai/mcp`, but it is **read-only**. This package wraps the full Gravity Dashboard API (including create/edit) as a local stdio MCP server that runs via `npx`, so requests go directly from your computer to `platform.trygravity.ai` — nothing passes through a third party.

## Prerequisites

- **Node.js ≥ 18** (`node --version` to check)
- **npx** (bundled with npm; comes with Node)
- A **Gravity advertiser API key** — get yours at <https://app.trygravity.ai> under **Settings → API Key**

## Quickstart

Add the following to your MCP client's configuration file. Replace `your-gravity-api-key` with your actual key.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["-y", "gravity-ads-mcp"],
      "env": {
        "GRAVITY_API_KEY": "your-gravity-api-key"
      }
    }
  }
}
```

> **Windows users:** If `npx` is not found, try `"command": "cmd"` with `"args": ["/c", "npx", "-y", "gravity-ads-mcp"]`.

### Claude Code

Create a `.mcp.json` file in your project root (or add to `~/.claude/mcp.json` for global config):

```json
{
  "mcpServers": {
    "gravity": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "gravity-ads-mcp"],
      "env": {
        "GRAVITY_API_KEY": "your-gravity-api-key"
      }
    }
  }
}
```

Or add via CLI:

```bash
claude mcp add gravity --env GRAVITY_API_KEY=your-gravity-api-key -- npx -y gravity-ads-mcp
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["-y", "gravity-ads-mcp"],
      "env": {
        "GRAVITY_API_KEY": "your-gravity-api-key"
      }
    }
  }
}
```

### opencode

`opencode.json` in your project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "gravity": {
      "type": "local",
      "command": ["npx", "-y", "gravity-ads-mcp"],
      "environment": {
        "GRAVITY_API_KEY": "your-gravity-api-key"
      }
    }
  }
}
```

> Note: opencode uses `"environment"` (not `"env"`).

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "gravity": {
      "command": "npx",
      "args": ["-y", "gravity-ads-mcp"],
      "env": {
        "GRAVITY_API_KEY": "your-gravity-api-key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GRAVITY_API_KEY` | Yes | — | Your Gravity advertiser API key |
| `GRAVITY_BASE_URL` | No | `https://platform.trygravity.ai` | Override the base URL (for testing/staging) |

## Tools

### Account

| Tool | Description |
|---|---|
| `gravity_get_info` | Get advertiser profile (ID, name, email) |
| `gravity_list_integrations` | List connected Shopify stores |
| `gravity_list_pixels` | List all tracking pixels |
| `gravity_create_pixel` | Create a conversion pixel for a site URL |

### Campaigns

| Tool | Description |
|---|---|
| `gravity_list_campaigns` | List all campaigns with lifetime stats |
| `gravity_get_campaign` | Full campaign details with targeting config |
| `gravity_create_campaign` | Create a campaign with inline ad groups |
| `gravity_update_campaign` | Edit fields on an existing campaign |
| `gravity_pause_campaign` | Pause a campaign |
| `gravity_activate_campaign` | Activate a campaign (may trigger billing check) |
| `gravity_archive_campaign` | Toggle archive state |

### Ad Groups & Ads

| Tool | Description |
|---|---|
| `gravity_list_ad_groups` | List ad groups with embedded ads |
| `gravity_get_ad_group` | Single ad group with its ads |
| `gravity_create_ad_group` | Create a generative or manual ad group |
| `gravity_update_ad_group` | Update ad group fields or status |
| `gravity_archive_ad_group` | Archive an ad group and its ads |
| `gravity_create_ad` | Add a manual ad to a manual ad group |
| `gravity_update_ad` | Edit a manual ad's copy, CTA, etc. |
| `gravity_archive_ad` | Archive a manual ad |

### Reporting

| Tool | Description |
|---|---|
| `gravity_get_metrics` | Daily time-series: impressions, clicks, spend, conversions, CTR, CPC, CPM, CPA, ROAS |
| `gravity_get_ad_unit_metrics` | Per-ad-unit daily metrics |
| `gravity_get_ad_group_metrics` | Per-ad-group daily metrics (paginated) |
| `gravity_list_conversions` | Recent conversions with cursor pagination |
| `gravity_get_billing` | Billing summary (spend, billed, unbilled, credits) |
| `gravity_get_events_analytics` | Pixel event analytics (domains, hourly, event types) |
| `gravity_get_conversion_stats` | Conversion time-series by event type |

## Example Prompts

Once configured, try asking your agent:

- "List my active campaigns"
- "What's my ROAS for the last 14 days?"
- "Create a campaign called 'Summer Sale' with a $100/day budget, targeting US and CA, using a generative ad group for running shoes"
- "Pause all campaigns over $500 spend"
- "Show me ad group performance for campaign camp-456 over the last 7 days in America/New_York"
- "Create a manual ad group with these ads: headline '50% Off Running Shoes', copy 'Summer sale on all running shoes.', CTA 'Shop Now'"
- "What conversions did I get yesterday?"
- "Create a pixel for https://acme.com"

## Security & Privacy

- Your `GRAVITY_API_KEY` is passed as a process environment variable and **never logged or transmitted** to any server other than `platform.trygravity.ai`.
- All API requests go directly from your machine to Gravity's API — no intermediary.
- Running via `npx` means no global install; the server starts fresh each session.
- Regenerate your key anytime at <https://app.trygravity.ai> under **Settings → API Key**.

## Development

```bash
git clone https://github.com/niyogi/gravity-ads-mcp.git
cd gravity-ads-mcp
npm install
npm run build
npm run typecheck
```

To test locally with a live API key:

```bash
GRAVITY_API_KEY=your-key node dist/index.js
```

The server speaks JSON-RPC over stdio. You can test the `tools/list` handshake:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  GRAVITY_API_KEY=your-key node dist/index.js
```

## Publishing

```bash
npm login
npm publish
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `npx` hangs on first run | npx downloads the package on first invocation — give it 10–20 seconds. |
| 401 Authentication error | Double-check your `GRAVITY_API_KEY`. Regenerate at <https://app.trygravity.ai> if needed. |
| 402 Campaign activation blocked | Your billing needs attention — check the Billing page in your Gravity dashboard. |
| 422 Validation error | The server response includes details. Ask your agent to check the error and adjust the payload. |
| OpenAI accounts: daily totals differ from dashboard | Set `"tz": "America/New_York"` in your request. OpenAI ad accounts report in that timezone. |
| Windows: `npx` not found in Claude Desktop | Use `"command": "cmd"` with `"args": ["/c", "npx", "-y", "gravity-ads-mcp"]` in your config. |

## License

MIT
