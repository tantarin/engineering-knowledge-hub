import "./style.css";
import type { Metadata } from "next";
import { siteName, authorName } from "../src/identity";
export const metadata: Metadata = {
  title: { default: siteName, template: `%s · ${siteName}` },
  authors: [{name: authorName}],
  description: "Личная база знаний Татьяны Таринской о бэкенд-разработке, архитектуре и технических интервью.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
