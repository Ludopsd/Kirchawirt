import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".csv": "text/csv",
};

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[key]">) {
  const { key } = await ctx.params;
  const decodedKey = decodeURIComponent(key);
  const ext = decodedKey.slice(decodedKey.lastIndexOf(".")).toLowerCase();

  try {
    const buffer = await getStorageAdapter().read(decodedKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }
}
