import "server-only";
import { put } from "@vercel/blob";
import crypto from "crypto";
import type { StorageAdapter, StoredFile } from "./index";
import { encodeBase64Url } from "@/lib/util/base64url";
import { guessExtension } from "./guess-extension";

/**
 * Speichert Dateien in Vercel Blob Storage. Gedacht für Deployments auf Vercel (serverless, kein
 * persistentes lokales Dateisystem). Erwartet die Umgebungsvariable BLOB_READ_WRITE_TOKEN, die Vercel
 * automatisch setzt, sobald im Projekt-Dashboard ein Blob Store verbunden wird — keine manuelle
 * Konfiguration nötig.
 *
 * Blobs werden mit access: "public" angelegt (Vercel Blobs mit "private"-Zugriff sind ein neueres Feature
 * und wurden hier nicht verwendet). Die App verlinkt nach außen trotzdem immer nur die eigene,
 * login-geschützte Route /api/files/[key] statt der rohen Blob-URL — die rohe URL enthält einen von
 * Vercel vergebenen zufälligen Suffix und wird nirgends im UI offengelegt.
 */
export class VercelBlobStorageAdapter implements StorageAdapter {
  async save(params: { buffer: Buffer; fileName: string; mimeType: string }): Promise<StoredFile> {
    const ext = params.fileName.includes(".")
      ? params.fileName.slice(params.fileName.lastIndexOf("."))
      : guessExtension(params.mimeType);
    const pathname = `invoices/${crypto.randomUUID()}${ext}`;
    const blob = await put(pathname, params.buffer, {
      access: "public",
      contentType: params.mimeType,
      addRandomSuffix: true,
    });
    return { storagePath: blob.url };
  }

  async read(storagePath: string): Promise<Buffer> {
    const res = await fetch(storagePath);
    if (!res.ok) throw new Error(`Blob nicht gefunden (${res.status}): ${storagePath}`);
    return Buffer.from(await res.arrayBuffer());
  }

  urlFor(storagePath: string): string {
    return `/api/files/${encodeBase64Url(storagePath)}`;
  }
}
