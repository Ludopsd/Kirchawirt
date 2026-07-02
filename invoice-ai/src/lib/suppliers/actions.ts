"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { normalizeSupplierName } from "@/lib/matching/supplier-match";

export interface SupplierFormState {
  error?: string;
}

function parseAliases(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIbans(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function readSupplierForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const kreditorenkonto = String(formData.get("kreditorenkonto") || "").trim();
  return {
    name,
    normalizedName: normalizeSupplierName(name),
    aliases: parseAliases(String(formData.get("aliases") || "")),
    ibans: parseIbans(String(formData.get("ibans") || "")),
    taxId: String(formData.get("taxId") || "").trim() || null,
    vatId: String(formData.get("vatId") || "").trim() || null,
    kreditorenkonto,
    defaultSachkonto: String(formData.get("defaultSachkonto") || "").trim() || null,
    street: String(formData.get("street") || "").trim() || null,
    postalCode: String(formData.get("postalCode") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    country: String(formData.get("country") || "DE").trim() || "DE",
  };
}

export async function createSupplierAction(
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser();
  const data = readSupplierForm(formData);
  if (!data.name) return { error: "Bitte einen Namen eingeben." };
  if (!data.kreditorenkonto) return { error: "Bitte ein Kreditorenkonto eingeben." };

  const supplier = await prisma.supplier.create({ data });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}/edit`);
}

export async function updateSupplierAction(
  supplierId: string,
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser();
  const data = readSupplierForm(formData);
  if (!data.name) return { error: "Bitte einen Namen eingeben." };
  if (!data.kreditorenkonto) return { error: "Bitte ein Kreditorenkonto eingeben." };

  await prisma.supplier.update({ where: { id: supplierId }, data });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}/edit`);
  return {};
}
