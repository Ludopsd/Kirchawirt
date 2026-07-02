import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/setup/seed-database";

/**
 * Einmalige Einrichtung per Browser-Aufruf (ohne Terminal), z.B. für Deployments auf Vercel & Co.
 * Nur aktiv, wenn SETUP_TOKEN als Umgebungsvariable gesetzt ist. Aufruf: /api/setup?token=<SETUP_TOKEN>
 * Danach SETUP_TOKEN aus den Umgebungsvariablen wieder entfernen, um die Route zu deaktivieren.
 */
function htmlPage(title: string, bodyHtml: string, ok: boolean) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;min-height:100vh;
align-items:center;justify-content:center;margin:0;padding:1.5rem}
.card{max-width:28rem;background:#fff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:1.5rem 1.75rem}
h1{font-size:1.05rem;margin:0 0 0.75rem}
a{color:#1e293b}
code{background:#f1f5f9;padding:0.1rem 0.35rem;border-radius:0.25rem}
.badge{display:inline-block;padding:0.15rem 0.6rem;border-radius:999px;font-size:0.8rem;font-weight:600;
background:${ok ? "#dcfce7" : "#fee2e2"};color:${ok ? "#15803d" : "#b91c1c"}}
</style></head><body><div class="card"><span class="badge">${ok ? "✓ Erfolgreich" : "Fehler"}</span>
<h1>${title}</h1>${bodyHtml}</div></body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expectedToken = process.env.SETUP_TOKEN;

  if (!expectedToken) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (token !== expectedToken) {
    return new NextResponse(
      htmlPage("Zugriff verweigert", "<p>Der Token ist falsch oder fehlt.</p>", false),
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const result = await seedDatabase(prisma);
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";
    return new NextResponse(
      htmlPage(
        "Einrichtung abgeschlossen",
        `<p>Admin-Login:</p>
         <p><code>${result.adminEmail}</code><br><code>${adminPassword}</code></p>
         <p>${result.accountsCount} Sachkonten und ${result.suppliersCount} neue Beispiel-Lieferanten angelegt.</p>
         <p><strong>Bitte danach SETUP_TOKEN aus den Umgebungsvariablen entfernen</strong> und das Passwort nach
         dem ersten Login ändern.</p>
         <p><a href="/login">→ Jetzt einloggen</a></p>`,
        true
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return new NextResponse(
      htmlPage(
        "Einrichtung fehlgeschlagen",
        `<p>${message}</p><p>Häufigste Ursache: Die Datenbank ist noch nicht erreichbar oder die Tabellen
         wurden noch nicht angelegt (Migration). Bitte <code>DATABASE_URL</code> prüfen und es in ein paar
         Minuten erneut versuchen — Migrationen laufen automatisch beim nächsten Deploy.</p>`,
        false
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
