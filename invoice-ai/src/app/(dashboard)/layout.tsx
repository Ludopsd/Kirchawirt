import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { logoutAction } from "@/lib/auth/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">Invoice AI</span>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/invoices" className="hover:text-slate-900">
                Rechnungen
              </Link>
              <Link href="/suppliers" className="hover:text-slate-900">
                Lieferanten
              </Link>
              <Link href="/accounts" className="hover:text-slate-900">
                Sachkonten
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/settings" className="hover:text-slate-900">
                  Einstellungen
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>
              {user.name} · <span className="text-slate-400">{user.role}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="text-slate-500 hover:text-slate-900 hover:underline">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
