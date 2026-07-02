import "server-only";
import { prisma } from "@/lib/db";
import { getStorageAdapter } from "@/lib/storage";

export async function getInvoiceReviewData(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      vatEntries: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      fields: true,
      sapExports: { orderBy: { createdAt: "desc" } },
      matchedSupplier: true,
      uploadedBy: { select: { name: true } },
      confirmedBy: { select: { name: true } },
    },
  });
  if (!invoice) return null;

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  const accounts = await prisma.chartOfAccountsEntry.findMany({
    where: { isActive: true },
    orderBy: { accountNumber: "asc" },
  });

  const storage = getStorageAdapter();

  return {
    invoice: {
      id: invoice.id,
      status: invoice.status,
      originalFileName: invoice.originalFileName,
      fileUrl: storage.urlFor(invoice.storagePath),
      mimeType: invoice.mimeType,
      pageCount: invoice.pageCount,
      vendorName: invoice.vendorName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString().slice(0, 10) : null,
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
      currency: invoice.currency,
      grossAmount: invoice.grossAmount ? Number(invoice.grossAmount) : null,
      netAmount: invoice.netAmount ? Number(invoice.netAmount) : null,
      iban: invoice.iban,
      taxId: invoice.taxId,
      kreditorenkonto: invoice.kreditorenkonto,
      sachkonto: invoice.sachkonto,
      matchedSupplierId: invoice.matchedSupplierId,
      matchedSupplierName: invoice.matchedSupplier?.name ?? null,
      supplierMatchConfidence: invoice.supplierMatchConfidence,
      supplierMatchMethod: invoice.supplierMatchMethod,
      extractionError: invoice.extractionError,
      aiNotes: invoice.aiNotes,
      sapDocumentNumber: invoice.sapDocumentNumber,
      sapErrorMessage: invoice.sapErrorMessage,
      uploadedByName: invoice.uploadedBy.name,
      confirmedByName: invoice.confirmedBy?.name ?? null,
      createdAt: invoice.createdAt.toISOString(),
      vatEntries: invoice.vatEntries.map((v) => ({
        rate: Number(v.rate),
        netAmount: Number(v.netAmount),
        vatAmount: Number(v.vatAmount),
        taxCode: v.taxCode,
      })),
      lineItems: invoice.lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        lineTotal: Number(li.lineTotal),
        vatRate: Number(li.vatRate),
      })),
      fields: invoice.fields.map((f) => ({
        fieldName: f.fieldName,
        rawValue: f.rawValue,
        confidence: f.confidence,
        pageNumber: f.pageNumber,
        boxX: f.boxX,
        boxY: f.boxY,
        boxWidth: f.boxWidth,
        boxHeight: f.boxHeight,
        boundingBoxSource: f.boundingBoxSource,
      })),
      sapExports: invoice.sapExports.map((e) => ({
        id: e.id,
        connectorType: e.connectorType,
        status: e.status,
        sapDocumentNumber: e.sapDocumentNumber,
        errorMessage: e.errorMessage,
        createdAt: e.createdAt.toISOString(),
        downloadUrl:
          e.responsePayload &&
          typeof e.responsePayload === "object" &&
          e.responsePayload !== null &&
          "storagePath" in e.responsePayload
            ? storage.urlFor(String((e.responsePayload as { storagePath: string }).storagePath))
            : null,
      })),
    },
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      kreditorenkonto: s.kreditorenkonto,
      defaultSachkonto: s.defaultSachkonto,
    })),
    accounts: accounts.map((a) => ({ accountNumber: a.accountNumber, accountName: a.accountName })),
  };
}

export type InvoiceReviewData = NonNullable<Awaited<ReturnType<typeof getInvoiceReviewData>>>;
