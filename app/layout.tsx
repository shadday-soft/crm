import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "sileo/styles.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prospecta — Prospección de negocios",
  description:
    "Encuentra negocios sin sitio web en un área del mapa y gestiónalos como prospectos de venta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-surface text-on-surface">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
