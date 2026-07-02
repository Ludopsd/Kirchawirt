import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StorageAdapter, StoredFile } from "./index";

export class LocalDiskStorageAdapter implements StorageAdapter {
  constructor(private readonly baseDir: string) {}

  async save(params: { buffer: Buffer; fileName: string; mimeType: string }): Promise<StoredFile> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const ext = path.extname(params.fileName) || guessExtension(params.mimeType);
    const key = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(this.baseDir, key);
    await fs.writeFile(fullPath, params.buffer);
    return { storagePath: key };
  }

  async read(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, storagePath);
    return fs.readFile(fullPath);
  }

  urlFor(storagePath: string): string {
    return `/api/files/${encodeURIComponent(storagePath)}`;
  }
}

function guessExtension(mimeType: string): string {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}
