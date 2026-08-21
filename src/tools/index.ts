import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "./account.js";
import { registerCampaignTools } from "./campaigns.js";
import { registerAdGroupTools } from "./adGroups.js";
import { registerReportingTools } from "./reporting.js";

export function registerAllTools(server: McpServer): number {
  registerAccountTools(server);
  registerCampaignTools(server);
  registerAdGroupTools(server);
  registerReportingTools(server);
  return 26;
}
