"use client";

import { useState, useTransition } from "react";
import { testSapConnectionAction } from "@/lib/sap/actions";

export function ConnectionTestButton() {
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await testSapConnectionAction()))}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Teste…" : "Verbindung testen"}
      </button>
      {result && (
        <p className={`mt-2 text-sm ${result.ok ? "text-green-700" : "text-amber-700"}`}>
          {result.ok ? "✓ " : "⚠ "}
          {result.message}
        </p>
      )}
    </div>
  );
}
