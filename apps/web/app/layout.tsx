import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Pantry",
  description: "Warm Swiggy food and grocery planning assistant"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
