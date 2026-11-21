import "./style.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Engineering Knowledge Hub",
  description: "Персональная лаборатория backend-инженера",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
