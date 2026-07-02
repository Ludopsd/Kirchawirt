import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getAnthropicModel } from "./client";
import { invoiceExtractionSchema, type InvoiceExtractionResult } from "./extraction-schema";

const SYSTEM_PROMPT = `Du liest Eingangsrechnungen (Kreditorenrechnungen) für die Finanzbuchhaltung aus.

Regeln:
- Lies nur, was tatsächlich auf der Rechnung steht. Erfinde keine Werte.
- Wenn ein Feld nicht auf der Rechnung vorkommt, setze es auf null (nicht raten).
- confidence gibt an, wie sicher du dir beim jeweiligen Wert bist (0 = geraten/unsicher, 1 = eindeutig lesbar).
- approximateBoundingBox ist nur eine grobe Orientierungshilfe für einen Menschen, der die Stelle auf der Rechnung
  wiederfinden soll. Wenn du keine sinnvolle Schätzung machen kannst, lasse es weg (null). Erfinde keine Koordinaten.
- Wenn du einen Wert selbst berechnen musstest (z.B. Netto aus Brutto minus MwSt.), beschreibe das kurz in "notes"
  und vergib eine niedrigere confidence für dieses Feld — bei berechneten Werten ist approximateBoundingBox = null,
  da der Wert nicht direkt so auf der Rechnung steht.
- Beträge immer als Zahl (Punkt als Dezimaltrennzeichen), nicht als Text mit Währungssymbol.
- Datumsangaben immer als ISO-8601 (YYYY-MM-DD).`;

export interface ExtractInvoiceParams {
  buffer: Buffer;
  mimeType: string;
}

export async function extractInvoiceFromDocument(
  params: ExtractInvoiceParams
): Promise<InvoiceExtractionResult> {
  const client = getAnthropicClient();
  const model = getAnthropicModel();
  const base64 = params.buffer.toString("base64");

  const documentBlock =
    params.mimeType === "application/pdf"
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
        })
      : ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: params.mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        });

  const message = await client.messages.parse({
    model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          documentBlock,
          {
            type: "text",
            text: "Lies diese Eingangsrechnung strukturiert aus und liefere das Ergebnis gemäß dem vorgegebenen Format.",
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(invoiceExtractionSchema) },
  });

  if (!message.parsed_output) {
    throw new Error("Die KI-Antwort konnte nicht strukturiert ausgewertet werden (leere Antwort).");
  }

  return message.parsed_output;
}
