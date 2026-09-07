import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppChrome from "./AppChrome";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IELTS Prep",
  description: "Write, get marked, track the trend.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
