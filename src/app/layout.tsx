import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "House Construction Tracker",
  description: "Track construction expenses, materials, labour and progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 dark:bg-stone-900">
        {children}
      </body>
    </html>
  );
}
