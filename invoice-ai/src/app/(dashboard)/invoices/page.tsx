import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/format";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { matchedSupplier: true },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Rechnungen</h1>
        <Link
          href="/invoices/upload"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Rechnung hochladen
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {invoices.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            Noch keine Rechnungen hochgeladen.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Lieferant</th>
                <th className="px-4 py-2">Rechnungsnr.</th>
                <th className="px-4 py-2">Datum</th>
                <th className="px-4 py-2 text-right">Betrag</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Hochgeladen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-slate-900 hover:underline">
                      {inv.vendorName || inv.matchedSupplier?.name || inv.originalFileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.invoiceNumber || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    {formatCurrency(inv.grossAmount?.toString(), inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status]}`}
                    >
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
