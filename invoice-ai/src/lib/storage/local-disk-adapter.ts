import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StorageAdapter, StoredFile } from "./index";
import { encodeBase64Url } from "@/lib/util/base64url";
import { guessExtension } from "./guess-extension";

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
    return `/api/files/${encodeBase64Url(storagePath)}`;
  }
}
