import "server-only";
import { getStorageAdapter } from "@/lib/storage";
import type { SapConnector, SapPostingResult, SupplierInvoicePostingPayload } from "./connector";

/**
 * CSV-Layout angelehnt an klassische SAP-FI-Kreditorenbuchungsfelder (BKPF/BSEG).
 * Das ist eine vereinfachte, dokumentierte Näherung für den manuellen Import (z.B. per FB60/MIRO-Batch-Input)
 * — sie wurde NICHT von einem SAP-Berater für ein konkretes Buchungskreis-/Steuerkennzeichen-Setup abgenommen.
 * Eine Zeile pro Rechnung (Kopfdaten); für ein vollwertiges FI-Dokument mit Soll-/Haben-Zeilen je Sachkonto
 * muss die Aufteilung noch ergänzt werden, sobald das reale Kontierungsschema feststeht.
 */
const CSV_COLUMNS = [
  "BUKRS", // Buchungskreis
  "BLART", // Belegart
  "LIFNR", // Kreditorenkonto
  "HKONT", // Sachkonto
  "WRBTR", // Bruttobetrag
  "WAERS", // Währung
  "MWSKZ", // Steuerkennzeichen (hier: MwSt-Satz als Platzhalter)
  "BLDAT", // Belegdatum (Rechnungsdatum)
  "BUDAT", // Buchungsdatum
  "ZFBDT", // Fälligkeitsdatum
  "XBLNR", // Referenzbeleg (Rechnungsnummer)
  "SGTXT", // Buchungstext
] as const;

function csvEscape(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(payload: SupplierInvoicePostingPayload): string {
  const rows = [CSV_COLUMNS.join(";")];
  const vatCode = payload.vatEntries[0]?.taxCode || (payload.vatEntries[0]?.rate ? `V${Math.round(payload.vatEntries[0].rate)}` : "");
  const row = [
    payload.companyCode,
    "RE",
    payload.kreditorenkonto,
    payload.sachkonto,
    payload.grossAmount.toFixed(2),
    payload.currency,
    vatCode,
    payload.invoiceDate,
    payload.postingDate,
    payload.dueDate ?? "",
    payload.invoiceNumber,
    `${payload.vendorName} - ${payload.reference ?? payload.invoiceNumber}`,
  ].map((v) => csvEscape(String(v)));
  rows.push(row.join(";"));
  return rows.join("\r\n") + "\r\n";
}

export class ExportConnector implements SapConnector {
  readonly name = "SAP-Export (CSV)";
  readonly type = "EXPORT_CSV" as const;

  async postSupplierInvoice(payload: SupplierInvoicePostingPayload): Promise<SapPostingResult> {
    const csv = buildCsv(payload);
    const buffer = Buffer.from(csv, "utf-8");
    const stored = await getStorageAdapter().save({
      buffer,
      fileName: `sap-export-${payload.invoiceNumber || payload.invoiceId}.csv`,
      mimeType: "text/csv",
    });

    return {
      success: true,
      rawResponse: { storagePath: stored.storagePath, csvPreview: csv },
    };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: "Export-Connector benötigt keine Verbindung — Dateien werden lokal erzeugt." };
  }
}
