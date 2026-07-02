import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/current-user";
import { getSapConnector } from "@/lib/sap/connector-factory";
import { formatDate } from "@/lib/format";
import { ConnectionTestButton } from "./connection-test-button";

export default async function SettingsPage() {
  await requireAdmin();

  const connector = getSapConnector();
  const recentExports = await prisma.sapExportRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { invoice: { select: { invoiceNumber: true, vendorName: true } } },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-900">Einstellungen</h1>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">SAP-Anbindung</h2>
        <p className="mt-1 text-sm text-slate-600">
          Aktiver Connector: <strong>{connector.name}</strong> ({connector.type})
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Steuerung über die Umgebungsvariable <code className="rounded bg-slate-100 px-1">SAP_CONNECTOR</code>{" "}
          (<code>export</code> oder <code>odata</code>).
        </p>
        <div className="mt-3">
          <ConnectionTestButton />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Buchungs-/Export-Log</h2>
        {recentExports.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Noch keine Buchungsversuche.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-1">Zeit</th>
                <th className="pb-1">Rechnung</th>
                <th className="pb-1">Connector</th>
                <th className="pb-1">Status</th>
                <th className="pb-1">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentExports.map((e) => (
                <tr key={e.id}>
                  <td className="py-1.5 text-slate-500">{formatDate(e.createdAt)}</td>
                  <td className="py-1.5">
                    {e.invoice.vendorName} ({e.invoice.invoiceNumber})
                  </td>
                  <td className="py-1.5">{e.connectorType}</td>
                  <td className="py-1.5">
                    <span className={e.status === "SUCCESS" ? "text-green-700" : "text-red-700"}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-slate-500">
                    {e.sapDocumentNumber || e.errorMessage || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
