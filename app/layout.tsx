import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import GlobalCompactFooter from "@/components/GlobalCompactFooter";

export const metadata: Metadata = {
  title: "DataW - Data Gathering Platform",
  description: "Comprehensive data gathering and analysis platform",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <main className="flex-1">{children}</main>
            <GlobalCompactFooter />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
