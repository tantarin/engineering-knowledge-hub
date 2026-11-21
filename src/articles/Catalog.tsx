"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useArticleSearch } from "./search";
import { Search } from "lucide-react";
import type { ArticleListing } from "./library";
const normalize = (t: string) =>
  t.toLocaleLowerCase("ru").replaceAll("ё", "е").replaceAll("-", " ");
export default function Catalog({ entries }: { entries: ArticleListing[] }) {
  const [q, Q] = useState(""),
    [section, S] = useState("Все направления");
  useEffect(() => {
    Q(new URLSearchParams(location.search).get("q") || "");
  }, []);
  const groups = [...new Set(entries.map((e) => e.group))],
    words = normalize(q.trim()).split(/\s+/).filter(Boolean);
  const hits = new Set(useArticleSearch(q).map((e) => e.slug));
  const list = entries.filter((e) => {
    const text = normalize([e.slug, e.title, e.summary, e.group].join(" "));
    return (
      (section === "Все направления" || section === e.group) &&
      (hits.has(e.slug) || words.every((w) => text.includes(w)))
    );
  });
  return (
    <>
      <div className="catalog-filters">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Найти статью"
            placeholder="Найти статью: MVCC, потоки, интервью…"
            value={q}
            onChange={(e) => Q(e.target.value)}
          />
        </label>
        <select
          aria-label="Направление"
          value={section}
          onChange={(e) => S(e.target.value)}
        >
          {["Все направления", ...groups].map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>
      {groups.map((g) => {
        const matches = list.filter((e) => e.group === g);
        return matches.length ? (
          <section key={g}>
            <h2>
              {g} <small>{matches.length}</small>
            </h2>
            <div className="article-list">
              {matches.map((e) => (
                <Link
                  key={e.slug}
                  href={"/articles/" + e.slug + "/"}
                  prefetch={false}
                >
                  <h3>{e.title}</h3>
                  <p>{e.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!list.length && <p role="status">По этому запросу статей не найдено.</p>}
    </>
  );
}
