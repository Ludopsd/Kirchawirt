"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/lib/suppliers/actions";

export interface SupplierFormInitial {
  name?: string;
  aliases?: string[];
  ibans?: string[];
  taxId?: string | null;
  vatId?: string | null;
  kreditorenkonto?: string;
  defaultSachkonto?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string;
}

export function SupplierForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
  initial?: SupplierFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" name="name" defaultValue={initial?.name} required />
        <Field
          label="Aliase (durch Komma getrennt)"
          name="aliases"
          defaultValue={initial?.aliases?.join(", ")}
          placeholder="z.B. Müller Getränke, Getraenke Mueller"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="IBAN(s), eine pro Zeile"
          name="ibans"
          as="textarea"
          defaultValue={initial?.ibans?.join("\n")}
        />
        <Field label="Steuernummer" name="taxId" defaultValue={initial?.taxId ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="USt-IdNr." name="vatId" defaultValue={initial?.vatId ?? ""} />
        <Field
          label="Kreditorenkonto"
          name="kreditorenkonto"
          defaultValue={initial?.kreditorenkonto}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Standard-Sachkonto"
          name="defaultSachkonto"
          defaultValue={initial?.defaultSachkonto ?? ""}
        />
        <Field label="Land" name="country" defaultValue={initial?.country ?? "DE"} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Straße" name="street" defaultValue={initial?.street ?? ""} />
        <Field label="PLZ" name="postalCode" defaultValue={initial?.postalCode ?? ""} />
        <Field label="Ort" name="city" defaultValue={initial?.city ?? ""} />
      </div>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Speichern…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  as = "input",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  as?: "input" | "textarea";
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      )}
    </div>
  );
}
