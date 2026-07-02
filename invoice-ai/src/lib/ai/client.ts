import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY ist nicht gesetzt. Bitte einen gültigen Anthropic-API-Key in der .env-Datei hinterlegen, " +
        "damit Rechnungen automatisch ausgelesen werden können."
    );
    this.name = "MissingApiKeyError";
  }
}

let client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
}
