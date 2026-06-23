import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] })

export const metadata : Metadata = {
  title: "ShipFlow AI",
  description: "Accelerate your software delivery.",
}

import { GlobalProviders } from "~/providers/global";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <GlobalProviders>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </GlobalProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
