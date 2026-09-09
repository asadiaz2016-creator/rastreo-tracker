import type { Metadata } from "next";
import "./globals.css";
import NavTabs from "@/components/NavTabs";
import MaintenanceBanner from "@/components/MaintenanceBanner";

export const metadata: Metadata = {
  title: "Rastreo de Cajas y Plataformas -- CCP",
  description: "Rastreo de cajas de trailer y plataformas -- Custom Crates & Pallets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen max-w-3xl mx-auto">
          <header className="bg-ink text-paper px-5 pt-[18px] pb-4 sticky top-0 z-10">
            <div className="text-[11px] tracking-[0.14em] uppercase text-orange font-bold mb-0.5">
              Custom Crates &amp; Pallets
            </div>
            <h1 className="m-0 text-xl font-extrabold tracking-tight">Rastreo de Cajas y Plataformas</h1>
          </header>
          <NavTabs />
          <MaintenanceBanner />
          <main className="p-4 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
