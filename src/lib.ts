import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { GravityApiError } from "./client.js";

const MAX_OUTPUT_CHARS = 300_000;

export function jsonResult(data: unknown, notes?: string): CallToolResult {
  const raw = JSON.stringify(data, null, 2);
  let text = notes ? `${notes}\n\n${raw}` : raw;
  if (text.length > MAX_OUTPUT_CHARS) {
    text = text.slice(0, MAX_OUTPUT_CHARS) + "\n\n[... output truncated — narrow filters or paginate to see less ...]";
  }
  return { content: [{ type: "text", text }] };
}

export function textResult(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

export function validationFail(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

export function errorResult(err: unknown): CallToolResult {
  if (err instanceof GravityApiError)
    return { content: [{ type: "text", text: err.toMcpText() }], isError: true };
  if (err instanceof Error)
    return {
      content: [{ type: "text", text: `Unexpected error: ${err.message}` }],
      isError: true,
    };
  return {
    content: [{ type: "text", text: `Unexpected error: ${String(err)}` }],
    isError: true,
  };
}

export function tool<A>(
  fn: (args: A) => Promise<CallToolResult>
): (args: A) => Promise<CallToolResult> {
  return async (args: A): Promise<CallToolResult> => {
    try {
      return await fn(args);
    } catch (err) {
      return errorResult(err);
    }
  };
}
