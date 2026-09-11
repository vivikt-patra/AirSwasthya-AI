import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirSwasthya AI",
  description: "Odisha-first PM2.5 forecasting and health-risk advisory dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
