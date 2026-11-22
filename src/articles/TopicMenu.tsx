"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, Layers, PanelLeft, X } from "lucide-react";
import { siteName } from "../identity";
import type { MenuTopic } from "./topic-menu";

const Topics = createContext<MenuTopic[]>([]);
export function TopicsProvider({ topics, children }: { topics: MenuTopic[]; children: React.ReactNode }) {
  return <Topics.Provider value={topics}>{children}</Topics.Provider>;
}

export function TopicMenu({ onNavigate }: { onNavigate?: () => void }) {
  const topics = useContext(Topics);
  const path = usePathname().replace(/\/?$/, "/");
  const active = topics.find(t => t.sections.some(s => s.lessons.some(l => l.href === path)));
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);
  return <nav className="topic-menu" aria-label="Темы материалов">
    <div className="nav-label">ТЕМЫ МАТЕРИАЛОВ</div>
    {topics.map(topic => {
      const open = (expanded === undefined ? active?.title : expanded) === topic.title;
      return <div key={topic.title}>
        <button type="button" className="topic-toggle" aria-expanded={open} onClick={() => setExpanded(open ? null : topic.title)}>
          <ChevronRight size={14} aria-hidden="true"/><span>{topic.title}</span>
        </button>
        {open && <div className="topic-lessons">{topic.sections.map(section => <div key={section.title}>
          {topic.sections.length > 1 && <strong>{section.title}</strong>}
          <ol>{section.lessons.map(lesson => <li key={lesson.href}><Link prefetch={false} href={lesson.href} aria-current={lesson.href === path ? "page" : undefined} onClick={onNavigate}>{lesson.title}</Link></li>)}</ol>
        </div>)}</div>}
      </div>;
    })}
    <Link href="/books/" className="topic-toggle book-menu-link" aria-current={path === "/books/" ? "page" : undefined} onClick={onNavigate}>
      <BookOpen size={14} aria-hidden="true"/><span>Книги</span>
    </Link>
  </nav>;
}

export function ReadingLayout({ children }: { children: React.ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  return <div className={`shell reading-layout ${mobile ? "mobile-open" : ""}`} onKeyDown={e => { if(e.key === "Escape") setMobile(false); }}>
    {mobile && <button className="scrim" aria-label="Закрыть темы" onClick={() => setMobile(false)}/>}
    <aside id="reading-topics">
      <Link className="brand" href="/"><span className="logo"><Layers size={22}/></span><strong>{siteName}</strong></Link>
      <button className="reading-close" aria-label="Закрыть темы" onClick={() => setMobile(false)}><X size={16}/></button>
      <TopicMenu key={path} onNavigate={() => setMobile(false)}/>
      <Link className="nav article-nav" href="/articles/" onClick={() => setMobile(false)}>Весь учебный маршрут</Link>
    </aside>
    <div className="reading-view">
      <button className="reading-trigger" aria-controls="reading-topics" aria-expanded={mobile} onClick={() => setMobile(true)}><PanelLeft size={17}/> Темы материалов</button>
      {children}
    </div>
  </div>;
}
