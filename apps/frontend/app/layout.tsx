import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerHandler from "@/components/sw-handler";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Provider } from "jotai";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "News Analysis Dashboard",
  description:
    "Manage your news analysis tasks and monitor their execution status",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          {children}
          <ServiceWorkerHandler />
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
