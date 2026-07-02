"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import type { InvoiceReviewData } from "@/lib/invoices/review-data";
import { confirmAndBookAction, type BookState } from "@/lib/invoices/book-action";
import { STATUS_LABELS, STATUS_COLORS, formatCurrency } from "@/lib/format";
import { FilePreview } from "./file-preview";

type Invoice = InvoiceReviewData["invoice"];
type Supplier = InvoiceReviewData["suppliers"][number];
type Account = InvoiceReviewData["accounts"][number];

const FIELD_LABELS: Record<string, string> = {
  vendorName: "Lieferant",
  vendorAddress: "Adresse",
  invoiceNumber: "Rechnungsnummer",
  invoiceDate: "Rechnungsdatum",
  dueDate: "Fälligkeitsdatum",
  currency: "Währung",
  grossAmount: "Bruttobetrag",
  netAmount: "Nettobetrag",
  iban: "IBAN",
  taxId: "Steuernummer / USt-IdNr.",
};

function ConfidenceDot({ confidence }: { confidence: number | null | undefined }) {
  if (confidence === null || confidence === undefined) return null;
  const color = confidence >= 0.8 ? "bg-green-500" : confidence >= 0.5 ? "bg-amber-500" : "bg-red-500";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={`KI-Sicherheit: ${Math.round(confidence * 100)}%`}
    />
  );
}

function FieldLabel({
  fieldName,
  field,
  onHover,
}: {
  fieldName: string;
  field: Invoice["fields"][number] | undefined;
  onHover: (fieldName: string | null) => void;
}) {
  return (
    <label
      htmlFor={fieldName}
      className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
      onMouseEnter={() => onHover(fieldName)}
      onMouseLeave={() => onHover(null)}
    >
      {FIELD_LABELS[fieldName] || fieldName}
      <ConfidenceDot confidence={field?.confidence} />
    </label>
  );
}

export function InvoiceReview({
  invoice,
  suppliers,
  accounts,
}: {
  invoice: Invoice;
  suppliers: Supplier[];
  accounts: Account[];
}) {
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState(invoice.matchedSupplierId ?? "");
  const [kreditorenkonto, setKreditorenkonto] = useState(invoice.kreditorenkonto ?? "");
  const [sachkonto, setSachkonto] = useState(invoice.sachkonto ?? "");

  const fieldsByName = useMemo(() => {
    const map = new Map<string, Invoice["fields"][number]>();
    for (const f of invoice.fields) map.set(f.fieldName, f);
    return map;
  }, [invoice.fields]);

  const boundBookAction = confirmAndBookAction.bind(null, invoice.id);
  const [bookState, bookFormAction, bookPending] = useActionState<BookState, FormData>(
    boundBookAction,
    {}
  );

  const isBooked = invoice.status === "BOOKED";
  const latestExport = invoice.sapExports[0];

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) {
      setKreditorenkonto(supplier.kreditorenkonto);
      if (supplier.defaultSachkonto) setSachkonto(supplier.defaultSachkonto);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
            ← Alle Rechnungen
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            {invoice.vendorName || invoice.originalFileName}
          </h1>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>
          {STATUS_LABELS[invoice.status]}
        </span>
      </div>

      {invoice.extractionError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>KI-Extraktion fehlgeschlagen:</strong> {invoice.extractionError} — Felder bitte manuell
          eintragen.
        </div>
      )}
      {invoice.aiNotes && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Hinweis der KI:</strong> {invoice.aiNotes}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FilePreview
          fileUrl={invoice.fileUrl}
          mimeType={invoice.mimeType}
          fields={invoice.fields}
          hoveredField={hoveredField}
        />

        <form action={bookFormAction} className="space-y-6">
          <input type="hidden" name="matchedSupplierId" value={supplierId} />

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kopfdaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel fieldName="vendorName" field={fieldsByName.get("vendorName")} onHover={setHoveredField} />
                <input
                  id="vendorName"
                  name="vendorName"
                  defaultValue={invoice.vendorName ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <FieldLabel
                  fieldName="invoiceNumber"
                  field={fieldsByName.get("invoiceNumber")}
                  onHover={setHoveredField}
                />
                <input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  defaultValue={invoice.invoiceNumber ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <FieldLabel
                  fieldName="invoiceDate"
                  field={fieldsByName.get("invoiceDate")}
                  onHover={setHoveredField}
                />
                <input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  defaultValue={invoice.invoiceDate ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <FieldLabel fieldName="dueDate" field={fieldsByName.get("dueDate")} onHover={setHoveredField} />
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={invoice.dueDate ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div>
                <FieldLabel
                  fieldName="grossAmount"
                  field={fieldsByName.get("grossAmount")}
                  onHover={setHoveredField}
                />
                <input
                  id="grossAmount"
                  name="grossAmount"
                  type="number"
                  step="0.01"
                  defaultValue={invoice.grossAmount ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <FieldLabel
                  fieldName="netAmount"
                  field={fieldsByName.get("netAmount")}
                  onHover={setHoveredField}
                />
                <input
                  id="netAmount"
                  name="netAmount"
                  type="number"
                  step="0.01"
                  defaultValue={invoice.netAmount ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div>
                <FieldLabel fieldName="currency" field={fieldsByName.get("currency")} onHover={setHoveredField} />
                <input
                  id="currency"
                  name="currency"
                  defaultValue={invoice.currency}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div>
                <FieldLabel fieldName="iban" field={fieldsByName.get("iban")} onHover={setHoveredField} />
                <input
                  id="iban"
                  name="iban"
                  defaultValue={invoice.iban ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
              <div className="col-span-2">
                <FieldLabel fieldName="taxId" field={fieldsByName.get("taxId")} onHover={setHoveredField} />
                <input
                  id="taxId"
                  name="taxId"
                  defaultValue={invoice.taxId ?? ""}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">Kontierung</h2>
            {invoice.supplierMatchConfidence !== null && invoice.matchedSupplierId && (
              <p className="mb-3 text-xs text-slate-500">
                Lieferanten-Abgleich: {invoice.matchedSupplierName} ·{" "}
                {Math.round((invoice.supplierMatchConfidence ?? 0) * 100)}% Übereinstimmung (
                {invoice.supplierMatchMethod})
              </p>
            )}
            {!invoice.matchedSupplierId && (
              <p className="mb-3 text-xs text-amber-700">
                Kein Lieferant automatisch gefunden — bitte manuell auswählen oder neu anlegen.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700">Lieferant (Stammdaten)</label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                >
                  <option value="">— kein Treffer / manuell —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Kreditorenkonto</label>
                <input
                  name="kreditorenkonto"
                  value={kreditorenkonto}
                  onChange={(e) => setKreditorenkonto(e.target.value)}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Sachkonto</label>
                <input
                  list="accounts-list"
                  name="sachkonto"
                  value={sachkonto}
                  onChange={(e) => setSachkonto(e.target.value)}
                  disabled={isBooked}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  required
                />
                <datalist id="accounts-list">
                  {accounts.map((a) => (
                    <option key={a.accountNumber} value={a.accountNumber}>
                      {a.accountName}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          {invoice.vatEntries.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">MwSt.</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="pb-1">Satz</th>
                    <th className="pb-1 text-right">Netto</th>
                    <th className="pb-1 text-right">MwSt.</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.vatEntries.map((v, i) => (
                    <tr key={i}>
                      <td className="py-0.5">{v.rate}%</td>
                      <td className="py-0.5 text-right">{formatCurrency(v.netAmount, invoice.currency)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(v.vatAmount, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {invoice.lineItems.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Positionen</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="pb-1">Beschreibung</th>
                    <th className="pb-1 text-right">Menge</th>
                    <th className="pb-1 text-right">Einzelpreis</th>
                    <th className="pb-1 text-right">Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="py-0.5">{li.description}</td>
                      <td className="py-0.5 text-right">{li.quantity}</td>
                      <td className="py-0.5 text-right">{formatCurrency(li.unitPrice, invoice.currency)}</td>
                      <td className="py-0.5 text-right">{formatCurrency(li.lineTotal, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            {isBooked ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-green-700">✓ Gebucht</p>
                {invoice.sapDocumentNumber && <p>SAP-Belegnummer: {invoice.sapDocumentNumber}</p>}
                {latestExport?.downloadUrl && (
                  <a
                    href={latestExport.downloadUrl}
                    className="inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                    download
                  >
                    ⬇ SAP-Exportdatei herunterladen
                  </a>
                )}
                {invoice.confirmedByName && (
                  <p className="text-xs text-slate-500">Bestätigt von {invoice.confirmedByName}</p>
                )}
              </div>
            ) : (
              <>
                {bookState.error && (
                  <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {bookState.error}
                    {invoice.status === "SAP_ERROR" && " — bitte korrigieren und erneut versuchen."}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={bookPending}
                  className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {bookPending ? "Wird gebucht…" : invoice.status === "SAP_ERROR" ? "Erneut versuchen" : "✓ Bestätigen & Buchen"}
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Prüfe die Felder links/oben gegen die Originalrechnung, bevor du buchst.
                </p>
              </>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}
