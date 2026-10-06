import type { MetadataRoute } from "next";

// Permite "Agregar a pantalla de inicio" en iPhone y Android con su propio icono.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rastreo de Cajas y Plataformas -- CCP",
    short_name: "Rastreo CCP",
    description: "Rastreo de cajas de trailer y plataformas -- Custom Crates & Pallets",
    start_url: "/",
    display: "standalone",
    background_color: "#0f766e",
    theme_color: "#0f766e",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
