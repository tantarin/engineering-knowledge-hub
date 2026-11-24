import { articles } from "./sources.mjs";
import links from "./career-links.json";
export interface PublicArticle {
  num: number;
  slug: string;
  title: string;
  group: string;
  summary: string;
  body: string;
  ticket?: string;
  sqlExercise?: { hint: string; solution: string; explanation: string };
  interview?: { question: string; answer: string };
}
export type ArticleListing = Omit<PublicArticle, "body" | "num">;
export const library: PublicArticle[] = [...articles].sort((a,b)=>a.num-b.num);
export const entries: ArticleListing[] = library.map(
  ({ slug, title, group, summary }) => ({ slug, title, group, summary }),
);
export function related(a: PublicArticle) {
  return ((links as Record<string, number[]>)[a.num] || [])
    .map((num) => library.find((item) => item.num === num))
    .filter(Boolean);
}

import order from "./reading-order.json";
const listingsBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
export const chapters = order.map((chapter) => ({
  ...chapter,
  lessons: chapter.lessons.map((slug) => listingsBySlug.get(slug)!),
}));
export type ReadingChapter = (typeof chapters)[number];
export function readingPosition(slug: string) {
  const chapter = chapters.find((ch) =>
    ch.lessons.some((l) => l.slug === slug),
  )!;
  const track = chapters
    .filter((ch) => ch.track === chapter.track)
    .flatMap((ch) => ch.lessons);
  const position = track.findIndex((l) => l.slug === slug);
  return {
    chapter,
    lesson: chapter.lessons.findIndex((l) => l.slug === slug) + 1,
    previous: track[position - 1],
    next: track[position + 1],
  };
}
