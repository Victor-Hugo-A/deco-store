import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KITORA | Camisas de futebol",
  description: "Camisas de futebol atuais, retrôs e versão jogador, com medidas detalhadas e rastreio do pedido.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
