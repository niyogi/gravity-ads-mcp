import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "../client.js";
import { jsonResult, textResult, validationFail, tool } from "../lib.js";
import {
  countriesArray,
  devicesArray,
  manualAdSchema,
  AD_GROUP_INLINE_SHAPE,
} from "./schemas.js";

export function registerAdGroupTools(server: McpServer): void {
  server.registerTool(
    "gravity_list_ad_groups",
    {
      description:
        "List ad groups with embedded ads (up to 100 per group; ads_total carries full count).",
      inputSchema: {
        campaign_id: z
          .string()
          .optional()
          .describe("Filter to a single campaign."),
        include_archived: z
          .boolean()
          .default(false)
          .describe("Include archived groups."),
      },
    },
    tool(async (args) => {
      const data = await api("/advertiser-dashboard/ad-groups", {
        query: {
          campaign_id: args.campaign_id,
          include_archived: args.include_archived,
        },
      });
      return jsonResult(data, "Ad groups listed.");
    })
  );

  server.registerTool(
    "gravity_get_ad_group",
    {
      description: "Fetch a single ad group with its ads.",
      inputSchema: {
        ad_group_id: z.string().describe("The ad group ID."),
      },
    },
    tool(async (args) => {
      const data = await api(
        `/advertiser-dashboard/ad-groups/${encodeURIComponent(args.ad_group_id)}`
      );
      return jsonResult(data);
    })
  );

  server.registerTool(
    "gravity_create_ad_group",
    {
      description:
        "Create an ad group under a campaign. Provide campaign_id, name, and group_type. " +
        "For generative groups, include context or ad_prompt. For manual groups, include authored ads.",
      inputSchema: {
        campaign_id: z.string().describe("The campaign to attach this group to."),
        ...AD_GROUP_INLINE_SHAPE,
      },
    },
    tool(async (args) => {
      if (args.group_type === "generative" && (args.ads?.length ?? 0) > 0) {
        return validationFail(
          "Generative groups cannot have authored ads. Remove the ads array or set group_type='manual'."
        );
      }
      const data = await api("/advertiser-dashboard/ad-groups", {
        method: "POST",
        body: args,
      });
      return jsonResult(data, "Ad group created.");
    })
  );

  server.registerTool(
    "gravity_update_ad_group",
    {
      description:
        "Update any field on an ad group (send only what changes). " +
        "Converting manual to generative returns 422 if the group still has live manual ads.",
      inputSchema: {
        ad_group_id: z.string().describe("The ad group to update."),
        name: z.string().optional(),
        status: z
          .enum(["active", "paused", "archived"])
          .optional(),
        group_type: z
          .enum(["generative", "manual"])
          .optional()
          .describe("Cannot convert manual→generative while live manual ads exist."),
        context: z.string().optional(),
        negative_context: z.string().optional(),
        ad_prompt: z.string().optional(),
        landing_page: z.string().optional(),
        daily_budget: z.number().int().nullable().optional(),
        auto_optimize_budget: z.boolean().optional(),
        max_cpc: z.number().nullable().optional(),
        allowed_countries: countriesArray.optional(),
        allowed_devices: devicesArray.optional(),
        ads: z
          .array(manualAdSchema)
          .optional()
          .describe("Replace ad list (manual groups only)."),
      },
    },
    tool(async (args) => {
      const { ad_group_id, ...body } = args;
      if (Object.keys(body).length === 0) {
        return validationFail("Provide at least one field to update.");
      }
      const data = await api(
        `/advertiser-dashboard/ad-groups/${encodeURIComponent(ad_group_id)}`,
        { method: "PATCH", body }
      );
      return jsonResult(data, "Ad group updated.");
    })
  );

  server.registerTool(
    "gravity_archive_ad_group",
    {
      description:
        "Archive an ad group and its ads. Returns 204 on success.",
      inputSchema: {
        ad_group_id: z.string().describe("The ad group ID to archive."),
      },
    },
    tool(async (args) => {
      await api(
        `/advertiser-dashboard/ad-groups/${encodeURIComponent(args.ad_group_id)}`,
        { method: "DELETE" }
      );
      return textResult(`Ad group ${args.ad_group_id} archived.`);
    })
  );

  server.registerTool(
    "gravity_create_ad",
    {
      description:
        "Add an authored ad to a manual ad group. Returns 422 if the group is generative.",
      inputSchema: {
        ad_group_id: z.string().describe("The manual ad group to add an ad to."),
        ...Object.fromEntries(
          Object.entries(manualAdSchema.shape).map(([k, v]) => [k, v])
        ),
      },
    },
    tool(async (args) => {
      const { ad_group_id, ...body } = args;
      const data = await api(
        `/advertiser-dashboard/ad-groups/${encodeURIComponent(ad_group_id)}/ads`,
        { method: "POST", body }
      );
      return jsonResult(data, "Ad created.");
    })
  );

  server.registerTool(
    "gravity_update_ad",
    {
      description:
        "Edit a manual ad. Generated ads are read-only and return 422. Send only the fields you want changed.",
      inputSchema: {
        ad_id: z.string().describe("The ad ID to update."),
        headline: z.string().max(80).optional(),
        copy: z.string().max(500).optional(),
        cta: z.string().max(80).optional(),
        description: z.string().optional(),
        landing_page: z.string().optional(),
        image_url: z.string().optional(),
        name: z.string().optional(),
        status: z.enum(["active", "paused"]).optional(),
      },
    },
    tool(async (args) => {
      const { ad_id, ...body } = args;
      if (Object.keys(body).length === 0) {
        return validationFail("Provide at least one field to update.");
      }
      const data = await api(
        `/advertiser-dashboard/ads/${encodeURIComponent(ad_id)}`,
        { method: "PATCH", body }
      );
      return jsonResult(data, "Ad updated.");
    })
  );

  server.registerTool(
    "gravity_archive_ad",
    {
      description: "Archive a manual ad. Returns 204 on success.",
      inputSchema: {
        ad_id: z.string().describe("The ad ID to archive."),
      },
    },
    tool(async (args) => {
      await api(
        `/advertiser-dashboard/ads/${encodeURIComponent(args.ad_id)}`,
        { method: "DELETE" }
      );
      return textResult(`Ad ${args.ad_id} archived.`);
    })
  );
}
