export function guessExtension(mimeType: string): string {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "text/csv") return ".csv";
  return ".jpg";
}
