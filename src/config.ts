export interface Config {
  apiKey: string;
  baseUrl: string;
}

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;
  const apiKey = process.env.GRAVITY_API_KEY?.trim();
  const baseUrl = (
    process.env.GRAVITY_BASE_URL?.trim() ||
    "https://platform.trygravity.ai"
  ).replace(/\/+$/, "");
  if (!apiKey) {
    console.error(
      "[gravity-ads-mcp] Missing GRAVITY_API_KEY environment variable.\n" +
        "Get your key from https://app.trygravity.ai under Settings → API Key,\n" +
        "then set it in your MCP client config's \"env\" block."
    );
    process.exit(1);
  }
  cached = { apiKey, baseUrl };
  return cached;
}
