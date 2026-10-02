import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Migeanje Store",
  description:
    "Accesorios tecnológicos premium en Perú, elegidos para que tu equipo rinda al máximo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE">
      <body className="antialiased">{children}</body>
    </html>
  );
}
