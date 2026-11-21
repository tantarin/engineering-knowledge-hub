import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const sources = ["guide", "design", "data", "java"];
const keywords = JSON.parse(
  readFileSync(
    new URL("../src/articles/career-keywords.json", import.meta.url),
    "utf8",
  ),
);
const articles = sources.flatMap((s) =>
  JSON.parse(
    readFileSync(
      new URL("../src/articles/career-" + s + ".json", import.meta.url),
      "utf8",
    ),
  ),
);
const index = articles.map(({ num, slug, title, summary, group, body }) => ({
  slug,
  title,
  summary,
  group,
  terms:
    keywords[num] +
    " " +
    [
      ...new Set(body.toLocaleLowerCase("ru").match(/[\p{L}\p{N}_]+/gu) || []),
    ].join(" "),
}));
mkdirSync("public", { recursive: true });
writeFileSync("public/article-search.json", JSON.stringify(index));
