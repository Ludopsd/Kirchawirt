import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice AI — KI-Rechnungsauswertung",
  description: "KI-gestützte Erfassung und Buchung von Eingangsrechnungen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
