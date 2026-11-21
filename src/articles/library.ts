import guide from "./career-guide.json";
import design from "./career-design.json";
import data from "./career-data.json";
import java from "./career-java.json";
import links from "./career-links.json";
export interface PublicArticle {
  num: number;
  slug: string;
  title: string;
  group: string;
  summary: string;
  body: string;
}
export type ArticleListing = Omit<PublicArticle, "body" | "num">;
export const library: PublicArticle[] = [
  ...guide,
  ...design,
  ...data,
  ...java,
].sort((a, b) => a.num - b.num);
export const entries: ArticleListing[] = library.map(
  ({ slug, title, group, summary }) => ({ slug, title, group, summary }),
);
export function related(a: PublicArticle) {
  return ((links as Record<string, number[]>)[a.num] || [])
    .map((num) => library.find((item) => item.num === num))
    .filter(Boolean);
}
