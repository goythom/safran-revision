import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Prépa entretien Safran AE",
  description:
    "Application de révision interactive pour l'entretien d'ingénieur maîtrise d'ouvrage et intégration transmissions mécaniques.",
};

const themeScript = `try{var t=localStorage.getItem('safran-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.variable}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
