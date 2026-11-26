import type { Metadata } from "next";
import { DATA_KEY } from "@/lib/board-storage";
import { DARK_PALETTE, LIGHT_PALETTE } from "@/lib/theme-presets";
import { AppShell } from "@/components/app-shell";
import { ThemeRegistry } from "@/theme-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow — Plan with clarity",
  description:
    "A simple task manager built with Next.js and browser local storage."
};

const firstPaintTheme = `(function(){try{var mode="system";var raw=window.localStorage.getItem(${JSON.stringify(DATA_KEY)});if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.settings&&parsed.settings.mode){mode=parsed.settings.mode}}var dark=mode==="dark"||(mode==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.dataset.themeMode=dark?"dark":"light";root.style.colorScheme=dark?"dark":"light";root.style.backgroundColor=dark?${JSON.stringify(DARK_PALETTE.pageBackground)}:${JSON.stringify(LIGHT_PALETTE.pageBackground)}}catch(error){}})();`;

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: firstPaintTheme }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
