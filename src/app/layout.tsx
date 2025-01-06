import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BOOP - Planejamento e Hábitos",
  description: "Organize seus hábitos e planeje seu trimestre de forma simples e eficiente.",
  keywords: ["hábitos", "planejamento", "produtividade", "checklist", "metas", "organização"],
  authors: [{ name: "BOOP" }],
  creator: "BOOP",
  publisher: "BOOP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navigation />
        <main className="lg:pl-20 pt-[4.5rem] lg:pt-0">{children}</main>
      </body>
    </html>
  );
}
