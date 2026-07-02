import "server-only";
import Fuse from "fuse.js";
import { prisma } from "@/lib/db";
import type { Supplier } from "@/generated/prisma/client";

export function normalizeSupplierName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // Umlaute/Akzente entfernen
    .replace(/\b(gmbh|ag|kg|ohg|e\.?\s?k\.?|co\.?|gmbh\s?&\s?co\.?\s?kg|inc\.?|ltd\.?)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

export interface SupplierMatchResult {
  supplier: Supplier;
  confidence: number; // 0-1
  method: "iban" | "taxId" | "name-exact" | "name-fuzzy";
}

export async function matchSupplier(params: {
  vendorName?: string | null;
  iban?: string | null;
  taxId?: string | null;
}): Promise<SupplierMatchResult | null> {
  const suppliers = await prisma.supplier.findMany();
  if (suppliers.length === 0) return null;

  if (params.iban) {
    const normalizedIban = normalizeIban(params.iban);
    const match = suppliers.find((s) => s.ibans.some((i) => normalizeIban(i) === normalizedIban));
    if (match) return { supplier: match, confidence: 1, method: "iban" };
  }

  if (params.taxId) {
    const normalizedTaxId = params.taxId.replace(/\s+/g, "").toUpperCase();
    const match = suppliers.find(
      (s) =>
        (s.taxId && s.taxId.replace(/\s+/g, "").toUpperCase() === normalizedTaxId) ||
        (s.vatId && s.vatId.replace(/\s+/g, "").toUpperCase() === normalizedTaxId)
    );
    if (match) return { supplier: match, confidence: 1, method: "taxId" };
  }

  if (params.vendorName) {
    const normalized = normalizeSupplierName(params.vendorName);

    const exact = suppliers.find(
      (s) => s.normalizedName === normalized || s.aliases.some((a) => normalizeSupplierName(a) === normalized)
    );
    if (exact) return { supplier: exact, confidence: 0.98, method: "name-exact" };

    const candidates = suppliers.flatMap((s) => [
      { supplier: s, searchName: s.normalizedName },
      ...s.aliases.map((a) => ({ supplier: s, searchName: normalizeSupplierName(a) })),
    ]);
    const fuse = new Fuse(candidates, { keys: ["searchName"], includeScore: true, threshold: 0.4 });
    const results = fuse.search(normalized);
    if (results.length > 0 && results[0].score !== undefined) {
      const confidence = 1 - results[0].score;
      if (confidence >= 0.55) {
        return { supplier: results[0].item.supplier, confidence, method: "name-fuzzy" };
      }
    }
  }

  return null;
}

export function suggestSachkonto(supplier: SupplierMatchResult | null): string | null {
  return supplier?.supplier.defaultSachkonto ?? null;
}
