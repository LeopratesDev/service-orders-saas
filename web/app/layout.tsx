import type { Metadata } from "next";
import { Syne, Nunito_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const syne = Syne({ subsets: ["latin"], variable: "--font-brand", weight: ["600", "700", "800"] });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Ordens de Serviço",
  description: "Plataforma de gestão de ordens de serviço com pagamento via Pix",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${nunitoSans.variable} ${ibmPlexMono.variable}`}
        style={{ fontFamily: "var(--font-body, 'Nunito Sans', system-ui, sans-serif)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
