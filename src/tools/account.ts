import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../client.js";
import { jsonResult, tool } from "../lib.js";

export function registerAccountTools(server: McpServer): void {
  server.registerTool(
    "gravity_get_info",
    {
      description:
        "Get advertiser profile info (advertiser ID, name, email).",
      inputSchema: {},
    },
    tool(async () => {
      const data = await api("/advertiser-dashboard/info");
      return jsonResult(data);
    })
  );

  server.registerTool(
    "gravity_list_integrations",
    {
      description: "List connected Shopify stores.",
      inputSchema: {},
    },
    tool(async () => {
      const data = await api("/advertiser-dashboard/integrations");
      return jsonResult(data, "Integrations listed.");
    })
  );

  server.registerTool(
    "gravity_list_pixels",
    {
      description: "List all tracking pixels on your account.",
      inputSchema: {},
    },
    tool(async () => {
      const data = await api("/advertiser-dashboard/pixels");
      return jsonResult(data, "Pixels listed.");
    })
  );

  server.registerTool(
    "gravity_create_pixel",
    {
      description:
        "Create a conversion pixel for a site. Returns 409 if a pixel already exists for the URL.",
      inputSchema: {
        url: z
          .string()
          .describe("Site URL the pixel will be installed on (https:// is prepended if missing)."),
        name: z
          .string()
          .optional()
          .describe('Display name. Defaults to "Untitled Pixel".'),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/pixels", {
        method: "POST",
        body: args,
      });
      return jsonResult(data, "Pixel created.");
    })
  );
}
