import { z } from "zod";

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const countriesArray = z
  .array(z.string())
  .describe('ISO 3166-1 alpha-2 country codes, e.g. ["US","CA"]');

export const devicesArray = z
  .array(z.string())
  .describe('Device types, e.g. ["desktop","mobile"]');

export const utmParamsSchema = z
  .union([
    z.record(z.string(), z.string()),
    z.array(z.record(z.string(), z.string())),
  ])
  .optional()
  .describe(
    "UTM parameters. Accepts either a { key: value } object or an array of { key, value } pairs."
  );

export const demographicsSchema = z
  .record(z.unknown())
  .optional()
  .describe("Demographics targeting configuration.");

export const leadFormConfigSchema = z
  .record(z.unknown())
  .optional()
  .describe("Lead-form configuration.");

export const manualAdSchema = z.object({
  name: z.string().optional().describe("Ad name (for identification)."),
  headline: z
    .string()
    .max(80)
    .describe("Ad headline, max 80 characters."),
  copy: z
    .string()
    .max(500)
    .describe("Ad body copy, max 500 characters."),
  cta: z.string().max(80).optional().describe("Call-to-action text, max 80 characters."),
  description: z.string().optional().describe("Optional ad description."),
  landing_page: z.string().optional().describe("Ad-level landing page override."),
  image_url: z.string().optional().describe("Image URL for the ad."),
  status: z.enum(["active", "paused"]).optional(),
});

export const AD_GROUP_INLINE_SHAPE = {
  name: z.string().describe("Ad group name."),
  group_type: z
    .enum(["generative", "manual"])
    .default("generative")
    .describe(
      'generative = Gravity AI-generates ads from context; manual = you author ads.'
    ),
  status: z
    .enum(["active", "paused", "archived"])
    .optional()
    .describe("Defaults to active."),
  context: z
    .string()
    .optional()
    .describe(
      "Targeting context to match conversations and guide ad generation."
    ),
  negative_context: z
    .string()
    .optional()
    .describe("Conversations or topics to avoid."),
  ad_prompt: z
    .string()
    .optional()
    .describe("Extra prompt guiding generative ad creation."),
  landing_page: z.string().optional().describe("Default landing page for this group's ads."),
  daily_budget: z.number().optional().describe("Group-level daily budget ($)"),
  auto_optimize_budget: z
    .boolean()
    .optional()
    .describe("Let Gravity allocate budget across groups (default true)."),
  min_daily_budget: z.number().optional(),
  max_daily_budget: z.number().optional(),
  max_cpc: z.number().optional().describe("Group-level max CPC bid."),
  allowed_countries: countriesArray.optional(),
  allowed_devices: devicesArray.optional(),
  ads: z
    .array(manualAdSchema)
    .optional()
    .describe("Authored ads (manual groups only)."),
};

export const DATE_RANGE_SHAPE = {
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Days to look back (1–365). Overrides dates when set."),
  start_date: dateStringSchema
    .optional()
    .describe("Start date. Overrides days when paired with end_date."),
  end_date: dateStringSchema
    .optional()
    .describe("End date. Requires start_date."),
  tz: z
    .string()
    .default("UTC")
    .describe(
      'IANA timezone for day bucketing (e.g. "America/New_York"). OpenAI ad accounts use America/New_York.'
    ),
};
