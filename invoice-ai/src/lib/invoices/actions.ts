"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { getStorageAdapter } from "@/lib/storage";
import { runExtractionPipeline } from "@/lib/ai/pipeline";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export interface UploadState {
  error?: string;
}

export async function uploadInvoiceAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Rechnung (Foto oder PDF) auswählen." };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Nur PDF, JPG, PNG oder WebP werden unterstützt." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Die Datei ist zu groß (max. 25 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorageAdapter().save({ buffer, fileName: file.name, mimeType: file.type });

  const invoice = await prisma.invoice.create({
    data: {
      originalFileName: file.name,
      storagePath: stored.storagePath,
      mimeType: file.type,
      status: "UPLOADED",
      uploadedByUserId: user.userId,
    },
  });

  // MVP: Extraktion läuft synchron im Request. Für höheres Volumen später auf eine
  // Warteschlange (z.B. BullMQ) umstellen, siehe README "Nicht Teil dieser Session".
  await runExtractionPipeline(invoice.id);

  redirect(`/invoices/${invoice.id}`);
}
