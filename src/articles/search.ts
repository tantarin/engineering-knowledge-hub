"use client";
import { useState, useEffect } from "react";
import type { ArticleListing } from "./library";
interface IndexedArticle extends ArticleListing {
  terms: string;
}
const normalize = (s: string) =>
  s.toLocaleLowerCase("ru").replaceAll("ё", "е").replaceAll("-", " ");
let cached: Promise<IndexedArticle[]>;
export function useArticleSearch(query: string) {
  const [index, setIndex] = useState<IndexedArticle[]>([]);
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  useEffect(() => {
    if (!query.trim() || index.length) return;
    let live = true;
    cached ??= fetch(
      (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/article-search.json",
    )
      .then(async (r) => {
        if (!r.ok) throw Error("Index unavailable");
        return r.json();
      })
      .catch((e) => {
        cached = undefined;
        throw e;
      });
    cached
      .then((v) => {
        if (live) setIndex(v);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [query, index.length]);
  return words.length
    ? index
        .filter((e) => {
          const text = normalize(
            [e.slug, e.title, e.summary, e.group, e.terms].join(" "),
          );
          return words.every((w) => text.includes(w));
        })
        .sort(
          (a, b) =>
            Number(
              normalize(b.title + " " + b.slug).includes(words.join(" ")),
            ) -
            Number(normalize(a.title + " " + a.slug).includes(words.join(" "))),
        )
    : [];
}
