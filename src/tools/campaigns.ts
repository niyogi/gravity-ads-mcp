import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../client.js";
import { jsonResult, validationFail, tool } from "../lib.js";
import {
  countriesArray,
  devicesArray,
  utmParamsSchema,
  demographicsSchema,
  leadFormConfigSchema,
  AD_GROUP_INLINE_SHAPE,
} from "./schemas.js";

const CREATE_SHAPE = {
  name: z.string().describe("Campaign name."),
  landing_page: z.string().describe("Destination URL for the campaign."),
  daily_budget: z.number().positive().describe("Daily budget in dollars."),
  status: z
    .enum(["draft", "active", "paused"])
    .optional()
    .describe(
      "Defaults handled server-side (active submits for review)."
    ),
  campaign_objective: z.string().optional().describe('e.g. "conversions"'),
  billing_model: z.string().optional().describe('e.g. "cpm"'),
  bid_strategy: z.string().optional().describe('e.g. "lowest_cost"'),
  is_active: z.boolean().optional(),
  start_time: z.string().optional().describe("ISO timestamp."),
  end_time: z.string().nullable().optional().describe("ISO timestamp, or null to clear."),
  click_goal: z.number().int().optional(),
  max_cpc: z
    .number()
    .optional()
    .describe(
      "Max CPC bid in $. Enables oCPC on conversions campaigns. Omit to use auto-bidding."
    ),
  impression_goal: z.number().int().optional(),
  max_cpm: z.number().optional(),
  conversion_type: z.string().optional(),
  max_cpa: z.number().optional(),
  demographics: demographicsSchema,
  utm_params: utmParamsSchema,
  allowed_countries: countriesArray.optional(),
  allowed_devices: devicesArray.optional(),
  lead_form_config: leadFormConfigSchema,
  ad_groups: z
    .array(z.object(AD_GROUP_INLINE_SHAPE))
    .optional()
    .describe(
      "Ad groups to create inline. Each entry uses the same shape as create_ad_group minus campaign_id."
    ),
  ad_unit_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Legacy: existing ad-unit IDs to link. Prefer ad_groups."
    ),
};

const UPDATE_SHAPE = {
  campaign_id: z.string().describe("The campaign to update."),
  name: z.string().optional(),
  landing_page: z.string().optional(),
  daily_budget: z.number().optional(),
  campaign_objective: z.string().optional(),
  max_cpc: z
    .number()
    .nullable()
    .optional()
    .describe("Send null or 0 to clear. Omit to leave unchanged."),
  status: z
    .enum(["active", "paused", "draft"])
    .optional()
    .describe("Use active/paused/draft."),
  start_time: z.string().nullable().optional().describe("ISO timestamp."),
  end_time: z.string().nullable().optional().describe("ISO timestamp, or null to clear."),
  allowed_countries: countriesArray.optional(),
  allowed_devices: devicesArray.optional(),
  utm_params: utmParamsSchema,
  custom_favicon_url: z.string().nullable().optional(),
  lead_form_config: leadFormConfigSchema,
};

export function registerCampaignTools(server: McpServer): void {
  server.registerTool(
    "gravity_create_campaign",
    {
      description:
        "Create a new Gravity advertising campaign. Provide at least one ad_group or ad_unit_id. " +
        "Each ad_group can be generative (Gravity writes ads) or manual (you write ads inline).",
      inputSchema: CREATE_SHAPE,
    },
    tool(async (args) => {
      const hasGroups = (args.ad_groups?.length ?? 0) > 0;
      const hasUnits = (args.ad_unit_ids?.length ?? 0) > 0;
      if (!hasGroups && !hasUnits) {
        return validationFail(
          "Provide at least one ad_group or ad_unit_id. " +
            "Example: add an ad_groups entry with group_type 'generative' and a context string, " +
            "or pass existing ad_unit_ids."
        );
      }
      if (args.status === "active" && args.is_active === false) {
        return validationFail(
          'Cannot create an active campaign with is_active=false. Use status="active" or omit is_active.'
        );
      }
      const data = await api("/advertiser-dashboard/campaigns", {
        method: "POST",
        body: args,
      });
      return jsonResult(data, "Campaign created.");
    })
  );

  server.registerTool(
    "gravity_update_campaign",
    {
      description:
        "Update one or more fields on an existing campaign. Send only the fields you want changed. " +
        "Send max_cpc as null to clear it and revert to auto-bidding.",
      inputSchema: UPDATE_SHAPE,
    },
    tool(async (args) => {
      const { campaign_id, ...body } = args;
      if (Object.keys(body).length === 0) {
        return validationFail(
          "Provide at least one field to update (name, status, daily_budget, etc.)."
        );
      }
      const data = await api(
        `/advertiser-dashboard/campaigns/${encodeURIComponent(campaign_id)}`,
        { method: "PATCH", body }
      );
      return jsonResult(data, "Campaign updated.");
    })
  );

  server.registerTool(
    "gravity_pause_campaign",
    {
      description: "Pause a campaign (sets status to paused and is_active to false).",
      inputSchema: { campaign_id: z.string().describe("The campaign ID.") },
    },
    tool(async (args) => {
      const data = await api(
        `/advertiser-dashboard/campaigns/${encodeURIComponent(args.campaign_id)}`,
        { method: "PATCH", body: { status: "paused" } }
      );
      return jsonResult(data, "Campaign paused.");
    })
  );

  server.registerTool(
    "gravity_activate_campaign",
    {
      description:
        "Activate a campaign (sets status to active). May return a 402 billing-gate error.",
      inputSchema: { campaign_id: z.string().describe("The campaign ID.") },
    },
    tool(async (args) => {
      const data = await api(
        `/advertiser-dashboard/campaigns/${encodeURIComponent(args.campaign_id)}`,
        { method: "PATCH", body: { status: "active" } }
      );
      return jsonResult(data, "Campaign activated.");
    })
  );

  server.registerTool(
    "gravity_archive_campaign",
    {
      description:
        "Toggle archive state. Archives the campaign (pausing it), or unarchives it if already archived.",
      inputSchema: {
        campaign_id: z
          .string()
          .describe("The campaign ID to archive or unarchive."),
      },
    },
    tool(async (args) => {
      const data = await api(
        `/advertiser-dashboard/campaigns/${encodeURIComponent(args.campaign_id)}/archive`,
        { method: "PATCH" }
      );
      return jsonResult(data, "Campaign archive state toggled.");
    })
  );

  server.registerTool(
    "gravity_list_campaigns",
    {
      description:
        "List all campaigns with lifetime stats (impressions, clicks, spend, conversions, conversion_value).",
      inputSchema: {
        status: z
          .string()
          .optional()
          .describe('Filter by status, e.g. "active", "paused", "draft".'),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/campaigns", {
        query: args.status !== undefined ? { status: args.status } : undefined,
      });
      const campaigns = (data as any).campaigns ?? data;
      return jsonResult(campaigns, "Campaigns listed.");
    })
  );

  server.registerTool(
    "gravity_get_campaign",
    {
      description:
        "Get full details for a single campaign, including targeting config and stats.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign ID."),
      },
    },
    tool(async (args) => {
      const data = await api(
        `/advertiser-dashboard/campaigns/${encodeURIComponent(args.campaign_id)}`
      );
      return jsonResult(data);
    })
  );
}
