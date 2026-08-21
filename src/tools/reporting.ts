import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../client.js";
import { jsonResult, tool } from "../lib.js";
import { DATE_RANGE_SHAPE } from "./schemas.js";

export function registerReportingTools(server: McpServer): void {
  server.registerTool(
    "gravity_get_metrics",
    {
      description:
        "Daily time-series performance metrics (impressions, clicks, spend, conversions, revenue, CTR, CPC, CPM, conversion rate, CPA, ROAS). " +
        "Omit campaign_id for aggregate account-level metrics.",
      inputSchema: {
        ...DATE_RANGE_SHAPE,
        campaign_id: z
          .string()
          .optional()
          .describe("Filter to a single campaign. Omit for all campaigns."),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/metrics", { query: args });
      return jsonResult(data, "Metrics fetched.");
    })
  );

  server.registerTool(
    "gravity_get_ad_unit_metrics",
    {
      description:
        "Daily time-series metrics broken down per ad unit — impressions, clicks, spend, CTR, CPC, CPM. " +
        "Use for creative-level reporting where campaign-level metrics aren't granular enough. " +
        "Returns 404 if the ad_unit_id is not found in your account.",
      inputSchema: {
        ...DATE_RANGE_SHAPE,
        campaign_id: z.string().optional(),
        ad_unit_id: z.string().optional().describe("Filter to a single ad unit."),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/ad-unit-metrics", {
        query: args,
      });
      return jsonResult(data, "Ad unit metrics fetched.");
    })
  );

  server.registerTool(
    "gravity_get_ad_group_metrics",
    {
      description:
        "Daily time-series metrics broken down per ad group. Returns one series per ad group. " +
        "Use offset to page through >2000 ad groups. The result includes truncated and total_ad_groups.",
      inputSchema: {
        ...DATE_RANGE_SHAPE,
        campaign_id: z.string().optional(),
        ad_group_id: z.string().optional(),
        include_archived: z.boolean().default(false),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("Skip this many ad groups. Page with offset += 2000 while truncated."),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/ad-group-metrics", {
        query: args,
      });
      const d = data as Record<string, unknown>;
      const truncated = d.truncated;
      const total = d.total_ad_groups;
      const offset = args.offset;
      const note = truncated
        ? `Showing offset ${offset}. Re-request with offset=${offset + 2000} to see more. Total ad groups: ${total}.`
        : `All ${total} ad groups shown.`;
      return jsonResult(data, note);
    })
  );

  server.registerTool(
    "gravity_list_conversions",
    {
      description:
        "Recent conversions with cursor-based pagination. Returns attributed and unattributed conversions. " +
        "Use limit to control page size (1–100). Returns next_cursor in the response when has_more is true.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe("Page size (1–100)."),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response's next_cursor."),
        campaign_id: z.string().optional(),
        event_type: z.string().optional().describe('e.g. "purchase", "lead"'),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/conversions", {
        query: args,
      });
      const d = data as Record<string, unknown>;
      const note = d.has_more
        ? `Has more. Use cursor="${d.next_cursor}" to fetch the next page.`
        : "All conversions shown (no more pages).";
      return jsonResult(data, note);
    })
  );

  server.registerTool(
    "gravity_get_billing",
    {
      description:
        "Billing summary — total spend, billed amount, unbilled amount, and credits.",
      inputSchema: {},
    },
    tool(async () => {
      const data = await api("/advertiser-dashboard/billing");
      return jsonResult(data, "Billing summary fetched.");
    })
  );

  server.registerTool(
    "gravity_get_events_analytics",
    {
      description:
        "Pixel event analytics — domain breakdowns, hourly time-series, and event type counts from your tracking pixel.",
      inputSchema: {
        ...DATE_RANGE_SHAPE,
        domain: z
          .string()
          .optional()
          .describe("Filter by domain (partial match)."),
        event_type: z
          .string()
          .optional()
          .describe('e.g. "page_view", "form_submit", "click"'),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/events/analytics", {
        query: args,
      });
      return jsonResult(data, "Events analytics fetched.");
    })
  );

  server.registerTool(
    "gravity_get_conversion_stats",
    {
      description:
        "Conversion time-series — daily totals and per-event-type breakdowns.",
      inputSchema: {
        ...DATE_RANGE_SHAPE,
        event_type: z.string().optional().describe('e.g. "purchase", "lead"'),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/events/conversion-stats", {
        query: args,
      });
      return jsonResult(data, "Conversion stats fetched.");
    })
  );
}
