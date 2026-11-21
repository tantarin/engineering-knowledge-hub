"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useArticleSearch } from "./search";
import type { ReadingChapter } from "./library";
const normalize = (s: string) =>
  s.toLocaleLowerCase("ru").replaceAll("ё", "е").replaceAll("-", " ");
export default function Catalog({ chapters }: { chapters: ReadingChapter[] }) {
  const [q, Q] = useState(""),
    [section, S] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    Q(params.get("q") || "");
    const selected = params.get("section");
    if (chapters.some((c) => c.id === selected)) S(selected);
  }, [chapters]);
  const hits = new Set(useArticleSearch(q).map((e) => e.slug));
  const words = normalize(q.trim()).split(/\s+/).filter(Boolean);
  const shown = chapters
    .filter((c) => !section || c.id === section)
    .map((c) => ({
      ...c,
      lessons: c.lessons
        .map((l, i) => ({ ...l, step: i + 1 }))
        .filter(
          (l) =>
            hits.has(l.slug) ||
            words.every((w) =>
              normalize(
                [l.title, l.slug, l.summary, c.title].join(" "),
              ).includes(w),
            ),
        ),
    }))
    .filter((c) => c.lessons.length);
  return (
    <>
      <div className="catalog-filters">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Найти статью"
            placeholder="Поиск по статьям"
            value={q}
            onChange={(e) => Q(e.target.value)}
          />
        </label>
        <select
          aria-label="Раздел"
          value={section}
          onChange={(e) => S(e.target.value)}
        >
          <option value="">Все разделы</option>
          {chapters.map((c) => (
            <option value={c.id} key={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {["technical", "career"].map((track) => {
        const group = shown.filter((c) => c.track === track);
        return group.length ? (
          <section key={track} className="track">
            <h2>
              {track === "technical"
                ? "Технический маршрут"
                : "Карьера и собеседования"}
            </h2>
            {group.map((c) => (
              <details
                className="reading-chapter"
                key={c.id + "-" + Boolean(q) + "-" + section}
                open={!!q || !!section || c.id === chapters[0].id}
              >
                <summary>
                  <strong>{c.title}</strong>
                  <small>{c.lessons.length} ст.</small>
                </summary>
                <p>{c.goal}</p>
                <ol>
                  {c.lessons.map((l) => (
                    <li key={l.slug} value={l.step}>
                      <Link href={"/articles/" + l.slug + "/"} prefetch={false}>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ol>
                    {c.id === "synchronization" && <Link href="/concurrency/">Дополнительные разборы по многопоточности</Link>}
              </details>
            ))}
          </section>
        ) : null;
      })}
      {!shown.length && <p role="status">По этому запросу статей нет.</p>}
    </>
  );
}
