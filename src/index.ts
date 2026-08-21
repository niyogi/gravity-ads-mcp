#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { getConfig } from "./config.js";

const NAME = "gravity-ads-mcp";
const VERSION = "0.1.0";

process.on("uncaughtException", (err) => {
  console.error(`[${NAME}] Uncaught exception:`, err);
});

process.on("unhandledRejection", (reason) => {
  console.error(`[${NAME}] Unhandled rejection:`, reason);
});

async function main() {
  getConfig();

  const server = new McpServer({ name: NAME, version: VERSION });
  registerAllTools(server);

  console.error(`[${NAME}] Starting stdio transport...`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[${NAME}] Connected. ${TOOLS_COUNT} tools registered.`);
}

const TOOLS_COUNT = 26;

main().catch((err) => {
  console.error(`[${NAME}] Fatal error during startup:`, err);
  process.exit(1);
});
