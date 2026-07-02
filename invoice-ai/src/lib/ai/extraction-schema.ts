import * as z from "zod/v4";

const boundingBoxSchema = z
  .object({
    page: z.number().int().min(1),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  })
  .nullable();

function extractedField<T extends z.ZodType>(valueSchema: T) {
  return z
    .object({
      value: valueSchema,
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Wie sicher bist du dir bei diesem Wert? 0 = geraten, 1 = eindeutig auf der Rechnung zu lesen."),
      approximateBoundingBox: boundingBoxSchema.describe(
        "Grobe Position des Textes auf der Seite, als Anteil (0-1) von Breite/Höhe. " +
          "Nur angeben wenn du eine ungefähre Position wirklich einschätzen kannst, sonst null."
      ),
    })
    .nullable();
}

export const vatEntrySchema = z.object({
  rate: z.number().describe("Mehrwertsteuersatz in Prozent, z.B. 19 oder 7"),
  netAmount: z.number(),
  vatAmount: z.number(),
  taxCode: z.string().nullable(),
});

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  vatRate: z.number(),
});

export const invoiceExtractionSchema = z.object({
  vendorName: extractedField(z.string()),
  vendorAddress: extractedField(z.string()),
  invoiceNumber: extractedField(z.string()),
  invoiceDate: extractedField(z.string().describe("ISO-8601-Datum, z.B. 2026-03-14")),
  dueDate: extractedField(z.string().describe("ISO-8601-Datum, z.B. 2026-04-14")),
  currency: extractedField(z.string().describe("3-stelliger ISO-Währungscode, z.B. EUR")),
  grossAmount: extractedField(z.number().describe("Bruttobetrag (inkl. MwSt.)")),
  netAmount: extractedField(z.number().describe("Nettobetrag (ohne MwSt.)")),
  iban: extractedField(z.string()),
  taxId: extractedField(z.string().describe("Steuernummer oder USt-IdNr. des Lieferanten")),
  vatEntries: z.array(vatEntrySchema),
  lineItems: z.array(lineItemSchema),
  pageCount: z.number().int().min(1),
  notes: z
    .string()
    .nullable()
    .describe("Auffälligkeiten, Unklarheiten oder Werte die du berechnen (nicht ablesen) musstest."),
});

export type InvoiceExtractionResult = z.infer<typeof invoiceExtractionSchema>;
export type ExtractedFieldValue<T> = { value: T; confidence: number; approximateBoundingBox: BoundingBox | null } | null;
export type BoundingBox = { page: number; x: number; y: number; width: number; height: number };
