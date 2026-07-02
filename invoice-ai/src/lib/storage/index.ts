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

let adapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  if (adapter) return adapter;

  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver !== "local") {
    throw new Error(
      `STORAGE_DRIVER="${driver}" ist noch nicht implementiert. Aktuell wird nur "local" unterstützt; ` +
        `ein S3-kompatibler Adapter kann durch Implementieren von StorageAdapter (src/lib/storage) ergänzt werden.`
    );
  }
  adapter = new LocalDiskStorageAdapter(process.env.STORAGE_LOCAL_DIR || "./storage/invoices");
  return adapter;
}
