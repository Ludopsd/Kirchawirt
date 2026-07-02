import { prisma } from "@/lib/db";

export default async function AccountsPage() {
  const accounts = await prisma.chartOfAccountsEntry.findMany({ orderBy: { accountNumber: "asc" } });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Kontenplan (Sachkonten)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Für die MVP-Version werden Sachkonten per Seed-Skript gepflegt (
        <code className="rounded bg-slate-100 px-1">prisma/seed.ts</code>). Eine Verwaltungsoberfläche kann
        bei Bedarf nach dem gleichen Muster wie die Lieferanten-Stammdaten ergänzt werden.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Kontonummer</th>
              <th className="px-4 py-2">Bezeichnung</th>
              <th className="px-4 py-2">Art</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-slate-900">{a.accountNumber}</td>
                <td className="px-4 py-3 text-slate-600">{a.accountName}</td>
                <td className="px-4 py-3 text-slate-600">{a.accountType}</td>
                <td className="px-4 py-3 text-slate-600">{a.isActive ? "aktiv" : "inaktiv"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
