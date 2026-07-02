import "server-only";
import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/storage";
import { extractInvoiceFromDocument } from "./extract-invoice";
import { matchSupplier, suggestSachkonto } from "@/lib/matching/supplier-match";
import type { InvoiceExtractionResult } from "./extraction-schema";

type ExtractedFieldEntry<T> = { value: T; confidence: number; approximateBoundingBox: BoxLike | null } | null;
type BoxLike = { page: number; x: number; y: number; width: number; height: number };

function fieldRows(invoiceId: string, fieldName: string, field: ExtractedFieldEntry<unknown>) {
  if (!field || field.value === null || field.value === undefined || field.value === "") return [];
  const box = field.approximateBoundingBox;
  return [
    {
      invoiceId,
      fieldName,
      rawValue: String(field.value),
      confidence: field.confidence,
      pageNumber: box?.page ?? 1,
      boxX: box?.x ?? null,
      boxY: box?.y ?? null,
      boxWidth: box?.width ?? null,
      boxHeight: box?.height ?? null,
      boundingBoxSource: box ? ("LLM_APPROXIMATE" as const) : ("NONE" as const),
      boundingBoxConfidence: box ? ("LOW" as const) : ("NONE" as const),
    },
  ];
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function runExtractionPipeline(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "EXTRACTING" } });

  let result: InvoiceExtractionResult;
  try {
    const buffer = await getStorageAdapter().read(invoice.storagePath);
    result = await extractInvoiceFromDocument({ buffer, mimeType: invoice.mimeType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler bei der KI-Extraktion.";
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PENDING_REVIEW", extractionError: message, extractedAt: new Date() },
    });
    return;
  }

  const supplierMatch = await matchSupplier({
    vendorName: result.vendorName?.value ?? null,
    iban: result.iban?.value ?? null,
    taxId: result.taxId?.value ?? null,
  });
  const sachkonto = suggestSachkonto(supplierMatch);

  await prisma.$transaction([
    prisma.extractedField.deleteMany({ where: { invoiceId } }),
    prisma.extractedField.createMany({
      data: [
        ...fieldRows(invoiceId, "vendorName", result.vendorName),
        ...fieldRows(invoiceId, "vendorAddress", result.vendorAddress),
        ...fieldRows(invoiceId, "invoiceNumber", result.invoiceNumber),
        ...fieldRows(invoiceId, "invoiceDate", result.invoiceDate),
        ...fieldRows(invoiceId, "dueDate", result.dueDate),
        ...fieldRows(invoiceId, "currency", result.currency),
        ...fieldRows(invoiceId, "grossAmount", result.grossAmount),
        ...fieldRows(invoiceId, "netAmount", result.netAmount),
        ...fieldRows(invoiceId, "iban", result.iban),
        ...fieldRows(invoiceId, "taxId", result.taxId),
      ],
    }),
    prisma.invoiceVatEntry.deleteMany({ where: { invoiceId } }),
    prisma.invoiceVatEntry.createMany({
      data: result.vatEntries.map((v) => ({
        invoiceId,
        rate: v.rate,
        netAmount: v.netAmount,
        vatAmount: v.vatAmount,
        taxCode: v.taxCode,
      })),
    }),
    prisma.invoiceLineItem.deleteMany({ where: { invoiceId } }),
    prisma.invoiceLineItem.createMany({
      data: result.lineItems.map((li, idx) => ({
        invoiceId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
        vatRate: li.vatRate,
        sortOrder: idx,
      })),
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PENDING_REVIEW",
        extractionRaw: JSON.parse(JSON.stringify(result)),
        extractionError: null,
        aiNotes: result.notes,
        extractedAt: new Date(),
        pageCount: result.pageCount,
        vendorName: result.vendorName?.value ?? null,
        invoiceNumber: result.invoiceNumber?.value ?? null,
        invoiceDate: parseDate(result.invoiceDate?.value),
        dueDate: parseDate(result.dueDate?.value),
        currency: result.currency?.value ?? "EUR",
        grossAmount: result.grossAmount?.value ?? null,
        netAmount: result.netAmount?.value ?? null,
        iban: result.iban?.value ?? null,
        taxId: result.taxId?.value ?? null,
        matchedSupplierId: supplierMatch?.supplier.id ?? null,
        supplierMatchConfidence: supplierMatch?.confidence ?? null,
        supplierMatchMethod: supplierMatch?.method ?? null,
        kreditorenkonto: supplierMatch?.supplier.kreditorenkonto ?? null,
        sachkonto,
      },
    }),
  ]);
}
