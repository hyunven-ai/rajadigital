"use client";

import { ThemeProvider } from "next-themes";
import { useColorTheme } from "@/hooks/useColorTheme";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    // Suppress known benign noise
    if (typeof first === "boolean") return; // next-themes boolean warning
    if (
      typeof first === "string" &&
      (first.includes("Encountered a script tag") ||
       first.includes("next-themes"))
    ) return;
    orig.apply(console, args);
  };
}

/** Thin component that applies color theme CSS variables on mount */
function ColorThemeApplier() {
  useColorTheme();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ColorThemeApplier />
      {children}
    </ThemeProvider>
  );
}
