import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { topicFields } from "../src/contracts.mjs";
const parse = (f) =>
  JSON.parse(readFileSync(new URL("../src/" + f, import.meta.url)));
const topics = [
  "curriculum-data.json",
  "curriculum-java.json",
  "curriculum-platform.json",
]
  .flatMap(parse)
  .map((t) =>
    topicFields.parse({
      ...t,
      id: t.key,
      skills: t.skills.map((v, i) =>
        typeof v === "string" ? { id: "s" + (i + 1), text: v } : v,
      ),
    }),
  );
if (new Set(topics.map((t) => t.id)).size !== topics.length)
  throw Error("Duplicate syllabus key");
const contexts = parse("revolut-context.json");
const release = createHash("sha256")
  .update(JSON.stringify(topics))
  .digest("hex")
  .slice(0, 16);
mkdirSync("public", { recursive: true });
writeFileSync(
  "public/syllabus.json",
  JSON.stringify({ release, topics, contexts }),
);
console.log(
  "Syllabus:",
  topics.length,
  "topics,",
  topics.reduce((n, t) => n + t.skills.length, 0),
  "skills",
);
