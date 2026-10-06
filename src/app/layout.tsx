import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instr = Instrument_Sans({ subsets: ["latin"], variable: "--font-instr", display: "swap", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Prépa entretien Safran AE",
  description:
    "Application de révision interactive pour l'entretien d'ingénieur maîtrise d'ouvrage et intégration transmissions mécaniques.",
};

const themeScript = `try{var q=new URLSearchParams(location.search).get('v');if(q==='a'||q==='b')localStorage.setItem('safran-v',q);document.documentElement.dataset.v=localStorage.getItem('safran-v')||'a'}catch(e){document.documentElement.dataset.v='a'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-v="a" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${geist.variable} ${geistMono.variable} ${instr.variable}`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
