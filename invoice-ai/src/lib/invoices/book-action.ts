"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { getSapConnector } from "@/lib/sap/connector-factory";
import type { SupplierInvoicePostingPayload } from "@/lib/sap/connector";

export interface BookState {
  error?: string;
  success?: boolean;
}

function requiredString(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) || "").trim();
  return v || null;
}

function requiredNumber(formData: FormData, name: string): number | null {
  const raw = formData.get(name);
  if (raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

export async function confirmAndBookAction(
  invoiceId: string,
  _prev: BookState,
  formData: FormData
): Promise<BookState> {
  const user = await requireUser();

  const vendorName = requiredString(formData, "vendorName");
  const invoiceNumber = requiredString(formData, "invoiceNumber");
  const invoiceDateRaw = requiredString(formData, "invoiceDate");
  const dueDateRaw = requiredString(formData, "dueDate");
  const currency = requiredString(formData, "currency") || "EUR";
  const grossAmount = requiredNumber(formData, "grossAmount");
  const netAmount = requiredNumber(formData, "netAmount");
  const iban = requiredString(formData, "iban");
  const taxId = requiredString(formData, "taxId");
  const kreditorenkonto = requiredString(formData, "kreditorenkonto");
  const sachkonto = requiredString(formData, "sachkonto");
  const matchedSupplierId = requiredString(formData, "matchedSupplierId");

  if (!vendorName || !invoiceNumber || !invoiceDateRaw || !grossAmount || !kreditorenkonto || !sachkonto) {
    return {
      error:
        "Bitte alle Pflichtfelder ausfüllen: Lieferant, Rechnungsnummer, Rechnungsdatum, Bruttobetrag, Kreditorenkonto, Sachkonto.",
    };
  }

  const invoiceDate = new Date(invoiceDateRaw);
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (Number.isNaN(invoiceDate.getTime())) {
    return { error: "Rechnungsdatum ist ungültig." };
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      vendorName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency,
      grossAmount,
      netAmount,
      iban,
      taxId,
      kreditorenkonto,
      sachkonto,
      matchedSupplierId,
      status: "CONFIRMED",
      confirmedByUserId: user.userId,
      confirmedAt: new Date(),
    },
    include: { vatEntries: true, lineItems: true },
  });

  const payload: SupplierInvoicePostingPayload = {
    invoiceId: invoice.id,
    companyCode: process.env.SAP_COMPANY_CODE || "1000",
    kreditorenkonto,
    sachkonto,
    invoiceNumber,
    invoiceDate: invoiceDate.toISOString().slice(0, 10),
    postingDate: new Date().toISOString().slice(0, 10),
    dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
    currency,
    grossAmount,
    netAmount: netAmount ?? grossAmount,
    vatEntries: invoice.vatEntries.map((v) => ({
      rate: Number(v.rate),
      netAmount: Number(v.netAmount),
      vatAmount: Number(v.vatAmount),
      taxCode: v.taxCode,
    })),
    vendorName,
    vendorTaxId: taxId,
    vendorIban: iban,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      sachkonto,
      netAmount: Number(li.lineTotal),
      vatRate: Number(li.vatRate),
    })),
    reference: invoiceNumber,
  };

  const connector = getSapConnector();
  let result;
  try {
    result = await connector.postSupplierInvoice(payload);
  } catch (err) {
    result = {
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unbekannter Fehler beim Buchen.",
    };
  }

  await prisma.sapExportRecord.create({
    data: {
      invoiceId: invoice.id,
      connectorType: connector.type,
      status: result.success ? "SUCCESS" : "FAILED",
      requestPayload: JSON.parse(JSON.stringify(payload)),
      responsePayload: result.rawResponse ? JSON.parse(JSON.stringify(result.rawResponse)) : undefined,
      sapDocumentNumber: result.sapDocumentNumber,
      errorMessage: result.errorMessage,
    },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: result.success
      ? {
          status: "BOOKED",
          sapDocumentNumber: result.sapDocumentNumber,
          sapErrorMessage: null,
          bookedAt: new Date(),
        }
      : {
          status: "SAP_ERROR",
          sapErrorMessage: result.errorMessage || "Unbekannter Fehler beim Buchen.",
        },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/invoices");

  if (!result.success) {
    return { error: result.errorMessage || "Buchen fehlgeschlagen." };
  }
  return { success: true };
}
