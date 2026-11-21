import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { hub } from "./store.mjs";
const root = path.resolve(process.argv[2] || "");
if (!process.argv[2]) throw Error("Укажите путь к папке");
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(path.join(dir, e.name))
      : e.isFile() && e.name.endsWith(".md")
        ? [path.join(dir, e.name)]
        : [],
  );
}
const files = walk(root),
  s = hub(),
  known = new Map(s.state().notes.map((n) => [n.origin, n])),
  names = new Map(),
  records = [];
let added = 0,
  edges = 0,
  unresolved = 0;
const vault = path.dirname(root);
function category(name, relative) {
  if (!relative.includes("/")) return "Карьера и интервью";
  if (/redis/i.test(name)) return "Redis";
  if (
    /postgres|transaction|MVCC|Read (Committed|Uncommitted)|Repeatable Read|Dirty Read|Phantom Read|Non-repeatable|Serializable|Serialization Anomaly|Database|Write Skew|ACID|Индекс|Транзакц|Lost Update|SQL|N Plus One/i.test(
      name,
    )
  )
    return "PostgreSQL";
  if (
    /thread|concurren|Java |atomic|synchron|semaphore|visibility|Futures|Priority Inversion|Read Write Locks|Livelock|Starvation|Mutex|Task Cancellation|Parallel|Immutability/i.test(
      name,
    )
  )
    return "Java 21";
  if (/outbox|inbox|Event Driven|Event Ordering|CDC|Delivery/i.test(name))
    return "Kafka";
  if (/DDD|Clean Architecture|CQRS/i.test(name)) return "Architecture";
  if (/сисдиз|system design/i.test(name)) return "System Design";
  if (
    /CAP Theorem|Sharding|Consistency|Microservice|Saga|Circuit Breaker|Choreography|Dual Write/i.test(
      name,
    )
  )
    return "Distributed Systems";
  return "Скрининг";
}
for (const f of files) {
  const relative = path.relative(root, f),
    origin = path.join(path.basename(root), relative),
    raw = readFileSync(f, "utf8"),
    name = path.basename(f, ".md"),
    title = (raw.match(/^# (.+)$/m)?.[1] || name).slice(0, 240);
  let n = known.get(origin),
    body = n?.body || raw;
  if (!n) {
    body = raw.replace(
      /!\[\[([^\]|]+\.(?:png|webp|jpe?g))(?:\|[^\]]*)?\]\]/gi,
      (full, img) => {
        if (path.basename(img) !== img) return full;
        const asset = path.join(vault, "Картинки", img);
        if (!existsSync(asset)) return full;
        return "![" + img + "](" + s.saveImage(readFileSync(asset)) + ")";
      },
    );
    const fields = {
      title,
      body,
      origin,
      category: category(name, relative),
      tags: relative.includes("/") ? ["Скрининг"] : ["Карьера"],
      english:
        raw
          .match(
            /^## (?:English|Английский)[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m,
          )?.[1]
          ?.trim() || "",
    };
    n = { id: s.mutate("note", fields) };
    added++;
  }
  const record = { id: n.id, name, relative, body };
  records.push(record);
  for (const alias of [
    name,
    relative.replace(/\.md$/, ""),
    origin.replace(/\.md$/, ""),
  ]) {
    if (names.has(alias) && names.get(alias) !== record) names.set(alias, null);
    else names.set(alias, record);
  }
}
const existing = new Set(s.state().links.map((l) => l.source + ":" + l.target));
for (const r of records) {
  for (const match of r.body.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
    const target = match[1].split(/[|#]/)[0].replace(/\.md$/, "");
    if (!target) continue;
    const t =
      names.get(target) ||
      names.get(path.join(path.dirname(r.relative), target));
    if (!t) {
      unresolved++;
      continue;
    }
    const pair = r.id + ":" + t.id;
    if (t !== r && !existing.has(pair)) {
      s.mutate("link", {
        source: r.id,
        target: t.id,
        label: "Ссылка в заметке",
      });
      existing.add(pair);
      edges++;
    }
  }
}
console.log({ files: files.length, added, edges, unresolved });
