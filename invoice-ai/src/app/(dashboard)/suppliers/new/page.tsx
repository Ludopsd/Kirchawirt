import { SupplierForm } from "@/components/suppliers/supplier-form";
import { createSupplierAction } from "@/lib/suppliers/actions";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900">Neuer Lieferant</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <SupplierForm action={createSupplierAction} submitLabel="Anlegen" />
      </div>
    </div>
  );
}
