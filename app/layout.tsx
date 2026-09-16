import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/feedback/toaster";
import "./globals.css";
import "./shared/styles/global.scss";
import "./theme.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Fuente de marca Softgic Desk (ver app/shared/styles/_variables.scss: $font-ui/$font-brand usan --font-softgic). */
const softgic = Inter({
  variable: "--font-softgic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAC Central | Gestión de quejas",
  description: "Demo interna para la gestión de quejas y reclamaciones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${softgic.variable} h-full antialiased`}
      // El script de abajo fija data-theme antes de que React hidrate, así que el DOM real
      // difiere a propósito del HTML que Next.js generó en el servidor. Es el patrón
      // estándar para evitar el flash del tema incorrecto (mismo que usan next-themes, etc.).
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <script
          // Fija los atributos de tema y de colapso del sidebar ANTES de pintar, para evitar
          // el flash del tema incorrecto o un salto de layout en el sidebar. Ver
          // lib/theme-store.ts y lib/sidebar-store.ts, que luego sincronizan el estado de
          // React con lo que este script ya dejó puesto en el DOM.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("softgic-theme");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}try{if(localStorage.getItem("softgic-sidebar-collapsed")==="true"){document.documentElement.setAttribute("data-sidebar","collapsed");}}catch(e){}})();`,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
