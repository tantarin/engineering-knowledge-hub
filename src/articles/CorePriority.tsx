"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const key = "java-core-priority-v1";
export default function CorePriority({ lessons }: { lessons: {slug: string; title: string}[] }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(saved)) setDone(lessons.map(l => l.slug).filter(slug => saved.includes(slug)));
    } catch { /* Progress is optional when storage is unavailable. */ }
  }, [lessons]);

  function toggle(slug: string) {
    const next = done.includes(slug) ? done.filter(item => item !== slug) : [...done, slug];
    setDone(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep progress for this session. */ }
  }
  return <>
    <p aria-live="polite">Пройдено {done.length} из {lessons.length}. Отметки сохраняются в этом браузере.</p>
    <ol>{lessons.map(({slug, title}) => <li key={slug}>
      <input type="checkbox" checked={done.includes(slug)} onChange={() => toggle(slug)} aria-label={`Пройдено · ${title}`}/> <Link href={`/articles/${slug}/`}>{title}</Link>
      {slug === "generics-pecs" && <> · <Link href="/articles/generics-erasure/">Стирание типов</Link></>}
      {slug === "runnable-callable-future" && <> · <Link href="/articles/futures-and-async/">CompletableFuture</Link></>}
    </li>)}</ol>
  </>;
}
