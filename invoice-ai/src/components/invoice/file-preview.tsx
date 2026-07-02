"use client";

import type { InvoiceReviewData } from "@/lib/invoices/review-data";

type Field = InvoiceReviewData["invoice"]["fields"][number];

const FIELD_LABELS_SHORT: Record<string, string> = {
  vendorName: "Lieferant",
  vendorAddress: "Adresse",
  invoiceNumber: "Rechnungsnr.",
  invoiceDate: "Datum",
  dueDate: "Fällig",
  currency: "Währung",
  grossAmount: "Brutto",
  netAmount: "Netto",
  iban: "IBAN",
  taxId: "Steuer-ID",
};

export function FilePreview({
  fileUrl,
  mimeType,
  fields,
  hoveredField,
}: {
  fileUrl: string;
  mimeType: string;
  fields: Field[];
  hoveredField: string | null;
}) {
  const isImage = mimeType.startsWith("image/");
  const boxes = fields.filter((f) => f.boxX !== null && f.boxY !== null && f.boxWidth !== null && f.boxHeight !== null);

  if (!isImage) {
    return (
      <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm text-slate-500">
          Markierungen auf dem Bild sind aktuell nur für Fotos verfügbar. Für PDFs bitte das Original zum
          Vergleich öffnen.
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block w-fit rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          📄 PDF in neuem Tab öffnen
        </a>
        <iframe src={fileUrl} className="mt-3 h-[600px] w-full rounded-md border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs text-slate-400">
        Gestrichelte Markierungen sind KI-Schätzungen der ungefähren Position — kein Ersatz für die Prüfung
        gegen das Original.
      </p>
      <div className="relative w-full overflow-hidden rounded-md border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl} alt="Rechnung" className="block w-full" />
        {boxes.map((f, i) => {
          const isActive = hoveredField === f.fieldName;
          return (
            <div
              key={i}
              className={`pointer-events-none absolute border-2 border-dashed transition-colors ${
                isActive ? "border-blue-600 bg-blue-500/10" : "border-amber-500/70 bg-amber-400/5"
              }`}
              style={{
                left: `${(f.boxX ?? 0) * 100}%`,
                top: `${(f.boxY ?? 0) * 100}%`,
                width: `${(f.boxWidth ?? 0) * 100}%`,
                height: `${(f.boxHeight ?? 0) * 100}%`,
              }}
            >
              {isActive && (
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {FIELD_LABELS_SHORT[f.fieldName] || f.fieldName}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
