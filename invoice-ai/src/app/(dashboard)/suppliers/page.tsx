import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Lieferanten (Stammdaten)</h1>
        <Link
          href="/suppliers/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Lieferant
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {suppliers.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">Noch keine Lieferanten angelegt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Kreditorenkonto</th>
                <th className="px-4 py-2">Standard-Sachkonto</th>
                <th className="px-4 py-2">Ort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/suppliers/${s.id}/edit`} className="font-medium text-slate-900 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.kreditorenkonto}</td>
                  <td className="px-4 py-3 text-slate-600">{s.defaultSachkonto || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.city || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
