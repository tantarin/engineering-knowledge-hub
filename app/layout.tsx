import "./style.css";
import { menuTopics } from "../src/articles/topic-menu";
import { TopicsProvider } from "../src/articles/TopicMenu";
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
      <body><TopicsProvider topics={menuTopics}>{children}</TopicsProvider></body>
    </html>
  );
}
