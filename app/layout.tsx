import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assmat Contrats",
  description: "Gestion de contrats et pointages d'assistante maternelle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="page">
          <header className="header">
            <Link href="/" className="brand">
              Assmat Contrats
            </Link>
            <nav className="nav">
              <Link href="/">Contrats</Link>
              <Link href="/settings">Réglages</Link>
              <Link href="/help" aria-label="Aide et mode d'emploi">❓ Aide</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
