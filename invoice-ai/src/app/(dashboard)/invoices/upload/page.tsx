"use client";

import { useActionState, useState } from "react";
import { uploadInvoiceAction, type UploadState } from "@/lib/invoices/actions";

const initialState: UploadState = {};

export default function UploadInvoicePage() {
  const [state, formAction, pending] = useActionState(uploadInvoiceAction, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-lg font-semibold text-slate-900">Neue Rechnung hochladen</h1>
      <p className="mt-1 text-sm text-slate-500">
        Foto oder PDF einer Eingangsrechnung hochladen — die KI liest die Rechnung anschließend automatisch aus.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center hover:border-slate-400"
        >
          <span className="text-sm font-medium text-slate-700">
            {fileName ?? "Datei auswählen (PDF, JPG, PNG, WebP)"}
          </span>
          <span className="mt-1 text-xs text-slate-400">max. 25 MB</span>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            required
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        {state.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Wird hochgeladen und ausgelesen…" : "Hochladen & auslesen"}
        </button>
        {pending && (
          <p className="text-center text-xs text-slate-400">
            Die KI liest die Rechnung — das kann einige Sekunden dauern.
          </p>
        )}
      </form>
    </div>
  );
}
