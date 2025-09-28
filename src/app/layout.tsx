// src/app/layout.tsx
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

/* ───── page-wide metadata ───── */
export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  title: "Grow Grid",
  description: "Watch your savings grow pin by pin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
