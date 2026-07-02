import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { updateSupplierAction } from "@/lib/suppliers/actions";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const boundAction = updateSupplierAction.bind(null, supplier.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900">Lieferant bearbeiten</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <SupplierForm action={boundAction} initial={supplier} submitLabel="Speichern" />
      </div>
    </div>
  );
}
