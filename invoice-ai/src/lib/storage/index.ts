export interface StoredFile {
  /** Opaque path/key used to retrieve the file later; stored on the Invoice record. */
  storagePath: string;
}

export interface StorageAdapter {
  save(params: { buffer: Buffer; fileName: string; mimeType: string }): Promise<StoredFile>;
  read(storagePath: string): Promise<Buffer>;
  /** Public/servable URL for the review UI to display the file. */
  urlFor(storagePath: string): string;
}

import { LocalDiskStorageAdapter } from "./local-disk-adapter";
import { VercelBlobStorageAdapter } from "./vercel-blob-adapter";

let adapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  if (adapter) return adapter;

  const driver = process.env.STORAGE_DRIVER || "local";
  switch (driver) {
    case "local":
      adapter = new LocalDiskStorageAdapter(process.env.STORAGE_LOCAL_DIR || "./storage/invoices");
      break;
    case "vercel-blob":
      // Für Deployments auf Vercel: kein persistentes lokales Dateisystem verfügbar, daher Vercel Blob
      // Storage statt "local" verwenden. Setzt BLOB_READ_WRITE_TOKEN voraus (wird von Vercel automatisch
      // gesetzt, sobald ein Blob Store mit dem Projekt verbunden ist).
      adapter = new VercelBlobStorageAdapter();
      break;
    default:
      throw new Error(
        `STORAGE_DRIVER="${driver}" ist unbekannt. Unterstützt werden "local" und "vercel-blob"; ` +
          `ein weiterer S3-kompatibler Adapter kann durch Implementieren von StorageAdapter (src/lib/storage) ergänzt werden.`
      );
  }
  return adapter;
}
