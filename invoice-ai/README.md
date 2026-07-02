# Invoice AI — KI-gestützte Rechnungsauswertung mit SAP-Anbindung

Eigenständige App (unabhängig von der `index.html`-App im Repo-Wurzelverzeichnis): Foto oder PDF einer
Eingangsrechnung hochladen → eine KI liest die Rechnung aus → Lieferant/Kreditorenkonto/Sachkonto werden gegen
Stammdaten abgeglichen und vorbefüllt → ein Sachbearbeiter prüft/bestätigt → Buchen erzeugt einen SAP-fähigen
Beleg (Export-Datei oder — sobald angebunden — direkte Buchung über eine echte SAP-Schnittstelle).

## Tech-Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS
- PostgreSQL + Prisma 7 (Adapter-basiert, `@prisma/adapter-pg`)
- Eigene, schlanke Session-Auth (jose/JWT + bcrypt) — bewusst ohne NextAuth, da dessen Next-16-Unterstützung
  bei der Erstellung noch als Beta markiert war
- Anthropic Claude API (`@anthropic-ai/sdk`) für die Rechnungs-Extraktion (strukturierte JSON-Ausgabe)
- Austauschbarer `SapConnector` (Export-CSV als funktionierender Default, OData-Anbindung als Stub)
- Docker + docker-compose für Cloud- oder On-Premise-Betrieb

## Schnellstart (lokal, ohne Docker)

Voraussetzung: Node.js 22+, eine erreichbare PostgreSQL-Datenbank.

```bash
cd invoice-ai
npm install                      # führt automatisch `prisma generate` aus (postinstall)
cp .env.example .env             # danach DATABASE_URL, AUTH_SECRET etc. anpassen
npx prisma migrate dev           # legt Schema in der Datenbank an
npm run db:seed                  # legt Admin-Login + Beispiel-Stammdaten an
npm run dev                      # http://localhost:3000
```

Der Seed-Befehl gibt den Admin-Login in der Konsole aus (Standard: `admin@invoice-ai.local` /
`changeme123`, überschreibbar über `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). **Passwort nach dem ersten
Login ändern** (aktuell nur direkt in der Datenbank möglich — ein Profil-/Passwort-Ändern-Screen ist noch
nicht Teil dieser Version).

## Schnellstart mit Docker

```bash
cd invoice-ai
cp .env.example .env             # AUTH_SECRET setzen, ANTHROPIC_API_KEY optional eintragen
docker compose up --build
docker compose exec app npx prisma db seed   # einmalig, für Admin-Login + Beispieldaten
```

Die App läuft dann unter `http://localhost:3000`; Datenbank-Migrationen laufen beim Container-Start
automatisch (`docker-entrypoint.sh`). Dasselbe Image/Compose-Setup funktioniert sowohl für einen Cloud-Deploy
als auch On-Premise auf einem eigenen Server — es muss nichts umgebaut werden, nur die Umgebungsvariablen
(insbesondere `DATABASE_URL`, Speicherort, SAP-Zugangsdaten) sind pro Umgebung anzupassen.

## Deployment ohne Terminal (Browser only, z.B. vom Handy/Tablet aus)

Für alle, die die App ausprobieren wollen, ohne einen Computer mit Terminal/Docker zur Verfügung zu haben:
Vercel (Next.js-Hosting) + Neon (PostgreSQL) lassen sich komplett per Klick im Browser einrichten, beide
bieten einen kostenlosen Einstiegstarif und Login per GitHub-Konto.

1. **Datenbank anlegen**: auf [neon.tech](https://neon.tech) mit GitHub anmelden → neues Projekt erstellen →
   die angezeigte Connection-String-Zeile (beginnt mit `postgresql://...`) kopieren — das wird gleich
   `DATABASE_URL`.
2. **Projekt auf Vercel anlegen**: auf [vercel.com](https://vercel.com) mit GitHub anmelden → "Add New… →
   Project" → dieses Repository auswählen.
3. **Wichtig — Root Directory setzen**: Beim Import "Root Directory" auf `invoice-ai` stellen (die App liegt
   in einem Unterordner, nicht im Repo-Hauptverzeichnis).
4. **Build Command überschreiben**: unter "Build and Output Settings" das Build Command auf
   `npm run vercel-build` setzen (führt automatisch die Datenbank-Migration vor jedem Deploy aus).
5. **Umgebungsvariablen eintragen** (Projekt-Einstellungen → Environment Variables):
   - `DATABASE_URL` = die Connection-URL von Neon
   - `AUTH_SECRET` = ein zufälliger langer String (z.B. mit einem Passwort-Generator erzeugen)
   - `SETUP_TOKEN` = ein weiterer zufälliger String (nur für die einmalige Erst-Einrichtung, siehe Schritt 7)
   - `STORAGE_DRIVER` = `vercel-blob`
   - `SAP_CONNECTOR` = `export`
   - `SAP_COMPANY_CODE` = `1000`
   - `ANTHROPIC_API_KEY` = optional, nur falls schon ein Key vorhanden ist
6. **Dateispeicher verbinden**: im Vercel-Projekt unter "Storage" einen neuen **Blob**-Store erstellen und mit
   dem Projekt verbinden — dabei wird automatisch die Umgebungsvariable `BLOB_READ_WRITE_TOKEN` gesetzt, ohne
   dass man selbst etwas kopieren muss. (Lokales `local`-Storage funktioniert auf Vercel nicht, da dort kein
   dauerhaftes Dateisystem existiert — deshalb `vercel-blob` in Schritt 5.)
7. **Deployen**, dann warten bis der Build fertig ist. Danach **einmalig** im Browser aufrufen:
   `https://<dein-projekt>.vercel.app/api/setup?token=<SETUP_TOKEN>` — legt Admin-Login und Beispiel-
   Stammdaten an. Anschließend `SETUP_TOKEN` aus den Umgebungsvariablen wieder entfernen und neu deployen,
   damit diese Route nicht dauerhaft erreichbar bleibt.
8. Unter `https://<dein-projekt>.vercel.app/login` einloggen (Login-Daten stehen auf der Seite aus Schritt 7)
   — funktioniert in jedem Browser, auch auf dem Handy/Tablet.

## Umgebungsvariablen (siehe `.env.example`)

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung |
| `AUTH_SECRET` | Zufälliger langer String zum Signieren der Login-Sessions (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | Claude-API-Key für die Rechnungs-Extraktion. **Fehlt er, stürzt die App nicht ab** — die Rechnung landet direkt im manuellen Prüfmodus mit einem Hinweistext, alle Felder sind dann von Hand auszufüllen. |
| `ANTHROPIC_MODEL` | Standard `claude-sonnet-5`. Bei schwer lesbaren/handschriftlichen Rechnungen ggf. auf ein leistungsfähigeres Modell umstellen. |
| `STORAGE_DRIVER` | `local` (Dateien auf der Platte/im Docker-Volume — für Docker/On-Premise) oder `vercel-blob` (für Vercel-Deployments, siehe oben; benötigt `BLOB_READ_WRITE_TOKEN`, wird von Vercel automatisch gesetzt). Ein weiterer S3-kompatibler Adapter kann durch Implementieren von `StorageAdapter` (`src/lib/storage/`) ergänzt werden. |
| `SETUP_TOKEN` | Nur für Deployments ohne Terminalzugriff: aktiviert `/api/setup?token=...` zum einmaligen Anlegen von Admin-Login + Beispiel-Stammdaten per Browser-Aufruf. Standardmäßig leer/deaktiviert (Route antwortet dann mit 404). |
| `SAP_CONNECTOR` | `export` (Default, erzeugt SAP-fähige CSV-Datei, kein Live-Zugang nötig) oder `odata` (echte S/4HANA-OData-Schnittstelle, sobald Zugangsdaten vorliegen) |
| `SAP_ODATA_BASE_URL` / `_USERNAME` / `_PASSWORD` | Nur relevant bei `SAP_CONNECTOR=odata` |
| `SAP_COMPANY_CODE` | Buchungskreis (BUKRS), der beim Export/der Buchung mitgegeben wird |

## Wie die KI-Extraktion funktioniert

`src/lib/ai/extract-invoice.ts` schickt das Foto/PDF direkt an Claude (PDFs nativ als Dokument, keine
serverseitige Konvertierung nötig) mit einem festen JSON-Schema (`src/lib/ai/extraction-schema.ts`). Jedes
Feld kommt mit einer Confidence (0–1) zurück; das Ergebnis wird in `ExtractedField`-Zeilen sowie den
bestätigten Kopf-Feldern der `Invoice` gespeichert (`src/lib/ai/pipeline.ts`). Anschließend läuft der
Lieferanten-Abgleich (`src/lib/matching/supplier-match.ts`): exakte IBAN/Steuer-ID-Treffer zählen am meisten,
danach ein fuzzy Namensabgleich (Fuse.js) gegen Name + Aliase der Lieferanten-Stammdaten.

**Wichtige Einschränkung zu den Markierungen auf dem Bild:** Claude erkennt Werte inhaltlich sehr zuverlässig,
liefert aber keine pixelgenauen Koordinaten wie eine dedizierte OCR-Engine. Die App zeigt deshalb nur
**gestrichelte, klar als "ungefähr" gekennzeichnete** Markierungen (Best-Effort-Schätzung der KI) — das ist
eine bewusste, im Planungsgespräch mit dem Kunden abgestimmte Entscheidung, um keine falsche Präzision
vorzutäuschen. Außerdem funktionieren Markierungen aktuell nur bei Fotos (JPG/PNG/WebP); bei PDFs wird das
Original zum Abgleich in einem eigenen Bereich angezeigt, aber ohne Overlay.

Ein Ausbauschritt für pixelgenaue, durchgezogene Markierungen (nicht Teil dieser Version) wäre: bei
text-basierten PDFs den PDF-Textlayer (`pdfjs-dist`) für exakte Wortkoordinaten nutzen, bei Fotos/Scans eine
OCR-Engine (z.B. Tesseract) für Wort-Bounding-Boxen einsetzen, und den von Claude gelieferten Feldwert darin
wiederfinden. Wenn kein sicherer Treffer gefunden wird, sollte explizit "Position nicht verifiziert" angezeigt
werden statt eine falsche Markierung zu raten.

## SAP-Anbindung

`src/lib/sap/connector.ts` definiert das Interface `SapConnector.postSupplierInvoice(payload)`. Zwei
Implementierungen:

- **`ExportConnector`** (`src/lib/sap/export-connector.ts`, Default): erzeugt eine CSV-Datei mit an
  klassische SAP-FI-Kreditorenbuchungsfelder angelehnten Spalten (`BUKRS`, `BLART`, `LIFNR`, `HKONT`,
  `WRBTR`, `MWSKZ`, `BLDAT`, `BUDAT`, `ZFBDT`, `XBLNR`, `SGTXT`). Funktioniert sofort ohne echten SAP-Zugang;
  die Datei kann z.B. per FB60/MIRO-Batch-Input importiert werden. **Dieses Layout wurde nicht von einem
  SAP-Berater für ein konkretes Buchungskreis-/Steuerkennzeichen-Setup abgenommen** und bildet außerdem nur
  eine vereinfachte Kopfzeile pro Rechnung ab (kein vollständiges Soll-/Haben-Dokument mit einer Zeile je
  Sachkonto) — vor produktivem Einsatz mit der Buchhaltung/dem SAP-Team abstimmen.
- **`ODataConnector`** (`src/lib/sap/odata-connector.ts`, Stub): vorbereitet für eine echte S/4HANA-OData-
  Schnittstelle (z.B. `API_SUPPLIERINVOICE_PROCESS_SRV`). Die Methoden sind bewusst nicht implementiert, da
  bei der Erstellung weder echte Zugangsdaten noch eine bestätigte Schnittstellenbeschreibung vorlagen. Siehe
  Kommentar in der Datei für die konkreten nächsten Schritte (Payload-Mapping, CSRF-Token-Handling).

Umschalten über `SAP_CONNECTOR` in `.env` — der Rest der App (Buchungs-Workflow, UI, Audit-Log
`SapExportRecord`) muss dafür nicht verändert werden. Eine echte RFC/BAPI- oder IDoc-Anbindung wäre eine
dritte Implementierung desselben Interfaces.

## Status-Workflow einer Rechnung

`UPLOADED → EXTRACTING → EXTRACTED → PENDING_REVIEW → CONFIRMED → BOOKED`, mit `SAP_ERROR` als Fehlerzweig
(erneutes Buchen über den "Erneut versuchen"-Button auf der Rechnungsseite möglich). Die eigentliche
KI-Extraktion läuft synchron innerhalb des Upload-Requests (kein Warteschlangen-System) — für höheres
Rechnungsvolumen sollte das auf eine Queue (z.B. BullMQ + Redis) umgestellt werden, siehe "Nicht Teil dieser
Version" unten.

## Rollen & Login

Zwei Rollen: `ADMIN` (zusätzlich Zugriff auf `/settings`) und `AP_CLERK` (Kreditorenbuchhaltung, kann
Rechnungen hochladen, prüfen und buchen). Login unter `/login`; Routenschutz läuft über `src/proxy.ts`
(in Next.js 16 heißt "Middleware" jetzt "Proxy") plus serverseitige Prüfung in jeder geschützten Seite.

## Nicht Teil dieser Version

- **Echte Live-Buchung in ein reales SAP-System** — es lagen keine SAP-Zugangsdaten vor; der OData-Connector
  ist ein typisierter Stub.
- **Pixelgenaue, OCR-basierte Markierungen** auf dem Rechnungsbild — aktuell nur Best-Effort-Schätzungen der
  KI, klar als "ungefähr" gekennzeichnet (siehe oben).
- **Ein echter, getesteter `ANTHROPIC_API_KEY`** — der Code ist gegen die Env-Variable geschrieben und
  degradiert sauber auf manuelle Eingabe, wenn der Key fehlt.
- **Ein von einem SAP-Berater abgenommenes CSV-Layout** für den Export-Connector.
- **Produktionshärtung**: Rate-Limiting, Warteschlange/Retries für die KI- und SAP-Aufrufe, Virenscan für
  Uploads, automatisierte Tests/CI, feingranularere Berechtigungen, Passwort-Reset-Flow.
- **Editierbare Rechnungspositionen** — Kopfdaten (Beträge, MwSt., Lieferant, Konten) sind im Review-Screen
  editierbar, einzelne Positionszeilen aktuell nur zur Kontrolle sichtbar, nicht editierbar.

## Projektstruktur (Kurzüberblick)

```
src/
  app/(dashboard)/        Geschützte Seiten: Rechnungen, Lieferanten, Sachkonten, Einstellungen
  app/login/               Login-Seite
  app/api/files/[key]/      Datei-Auslieferung (Rechnungsbilder, SAP-Exportdateien)
  components/invoice/       Review-UI (Formular, Bildvorschau mit Markierungen)
  components/suppliers/     Lieferanten-Formular
  lib/auth/                 Session/Login (JWT-Cookie, bcrypt)
  lib/ai/                   Claude-Anbindung, Extraktions-Schema, Pipeline
  lib/matching/             Lieferanten-Fuzzy-Matching
  lib/sap/                  SapConnector-Interface + Implementierungen
  lib/storage/               Datei-Speicher-Abstraktion
  lib/invoices/, lib/suppliers/   Server Actions
prisma/
  schema.prisma, migrations/, seed.ts
```
