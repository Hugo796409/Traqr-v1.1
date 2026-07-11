"use client";

import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Layout>{children}</Layout>
      </ThemeProvider>
    </AuthProvider>
  );
}
