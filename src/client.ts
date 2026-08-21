import { getConfig } from "./config.js";

const TIMEOUT_MS = 60_000;

export class GravityApiError extends Error {
  readonly status: number;
  readonly body?: string;
  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = "GravityApiError";
    this.status = status;
    this.body = body;
  }

  toMcpText(): string {
    const friendly = FRIENDLY_STATUS[this.status];
    const lines: string[] = [`Gravity API error (HTTP ${this.status}).`];
    if (friendly) lines.push(friendly);
    if (this.body) lines.push(`Server response: ${this.body.slice(0, 2000)}`);
    return lines.join("\n");
  }
}

const FRIENDLY_STATUS: Record<number, string> = {
  400: "Bad request — a parameter is out of range or malformed.",
  401:
    "Authentication failed — your GRAVITY_API_KEY is missing or invalid. " +
    "Get or regenerate it at https://app.trygravity.ai under Settings → API Key.",
  402:
    "Payment required — campaign activation is blocked by the billing gate. " +
    "Check billing in your Gravity dashboard.",
  403: "Forbidden — this API key cannot access the requested resource.",
  404:
    "Not found — the resource does not exist or belongs to a different account.",
  422: "Validation error — check the server response for details.",
  429: "Rate limited — slow down and retry shortly.",
  500: "Gravity server error — retry later.",
};

interface RequestOptions {
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}${path}`);

  if (opts.query) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null || v === "") continue;
      search.set(k, String(v));
    }
    const qs = search.toString();
    if (qs) url.search = qs;
  }

  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      typeof data === "string"
        ? data
        : JSON.stringify(data) ?? text;
    throw new GravityApiError(res.status, detail, detail || undefined);
  }

  return data as T;
}
