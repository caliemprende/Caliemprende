import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Cali Emprende | Compra local, impulsa Cali",
  description: "El directorio digital de Cali: encuentra negocios, tiendas, restaurantes, productos, servicios y planes locales, o registra tu emprendimiento para llegar a más clientes.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Cali Emprende" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
