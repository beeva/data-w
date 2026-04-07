import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { StoreProvider } from "@/lib/store/StoreProvider";
import GlobalCompactFooter from "@/components/GlobalCompactFooter";
import { DotlottieWasmDeprecationSilencer } from "@/components/DotlottieWasmDeprecationSilencer";
import ScrollToTop from "@/components/ScrollToTop";

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
          <StoreProvider>
            <AuthProvider>
              <DotlottieWasmDeprecationSilencer />
              <main className="flex-1">{children}</main>
              <ScrollToTop />
            </AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
