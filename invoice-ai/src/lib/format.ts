export function formatCurrency(amount: number | string | null | undefined, currency = "EUR"): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE").format(d);
}

export const STATUS_LABELS: Record<string, string> = {
  UPLOADED: "Hochgeladen",
  EXTRACTING: "Wird ausgelesen…",
  EXTRACTED: "Ausgelesen",
  PENDING_REVIEW: "Prüfung ausstehend",
  CONFIRMED: "Bestätigt",
  BOOKED: "Gebucht",
  SAP_ERROR: "SAP-Fehler",
};

export const STATUS_COLORS: Record<string, string> = {
  UPLOADED: "bg-slate-100 text-slate-700",
  EXTRACTING: "bg-blue-100 text-blue-700",
  EXTRACTED: "bg-blue-100 text-blue-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  BOOKED: "bg-green-100 text-green-700",
  SAP_ERROR: "bg-red-100 text-red-700",
};
