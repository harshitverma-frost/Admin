import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { Toaster } from "react-hot-toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KSP Wines — Admin Panel",
  description: "Manage products, orders, and categories for KSP Wines",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <AdminAuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#2D2926',
                color: '#FAF7F2',
                borderRadius: '10px',
                fontSize: '14px',
              },
            }}
          />
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}
