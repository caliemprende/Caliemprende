import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Cali Emprende | Compra local, impulsa Cali",
  description: "Descubre negocios, productos y servicios de emprendedores de Cali.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Cali Emprende" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
