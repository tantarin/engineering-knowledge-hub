import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fsrs, createEmptyCard } from "ts-fsrs";
import { z } from "zod";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
const str = z.string().max(160000),
  title = z.string().trim().min(1).max(240),
  id = z.string().uuid();
export const statuses = ["To Learn", "Learning", "Practicing", "Understood"];
const stamp = () => new Date().toISOString(),
  url = z
    .string()
    .max(2048)
    .url()
    .regex(/^https?:\/\//i);
const noteSchema = z.object({
  origin: z.string().max(1024).default(""),
  title,
  category: title,
  tags: z.array(title).max(40).default([]),
  sources: z.array(url).max(100).default([]),
  body: str.default(""),
  status: z.enum(statuses).default("To Learn"),
  level: z.number().int().min(0).max(5).default(0),
  practice: str.default(""),
  explanation: str.default(""),
  prompt: str.default(""),
  english: str.default(""),
});
const kinds = ["question", "card", "english", "post", "lab", "task"];
const details = z.object({
  answer: str.default(""),
  english: str.default(""),
  category: str.default(""),
  gap: str.default(""),
  score: z.array(z.number().int().min(0).max(2)).length(3).optional(),
  stage: z
    .enum(["Idea", "Research", "Draft", "Ready", "Published"])
    .default("Idea"),
  short: str.default(""),
  date: z.string().max(32).default(""),
  format: str.default(""),
  done: z.boolean().default(false),
  attempt: str.default(""),
  sources: z.array(url).default([]),
});
const itemSchema = z.object({
  kind: z.enum(kinds),
  title,
  note: id.nullable().default(null),
  details: details.default({}),
});
const linkSchema = z.object({ source: id, target: id, label: title });
const nowCard = () => createEmptyCard(new Date());
const decodeNote = (r) => ({
  ...r,
  tags: JSON.parse(r.tags),
  sources: JSON.parse(r.sources),
});
const decodeItem = (r) => ({ ...r, details: JSON.parse(r.details) });
const tables = ["notes", "revisions", "links", "items", "reviews", "assets"];
export function openStore(file, seed = true) {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000",
  );
  const all = (sql, ...args) => db.prepare(sql).all(...args),
    one = (sql, ...args) => db.prepare(sql).get(...args),
    run = (sql, ...args) => db.prepare(sql).run(...args);
  function tx(fn) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function insert(table, row) {
    const keys = Object.keys(row);
    run(
      "INSERT INTO " +
        table +
        " (" +
        keys.join(",") +
        ") VALUES (" +
        keys.map(() => "?").join(",") +
        ")",
      ...Object.values(row),
    );
  }
  function saveNote(input, key) {
    const n = noteSchema.parse(input),
      t = stamp(),
      old = key && one("SELECT * FROM notes WHERE id=?", key);
    if (key && !old) throw Error("Материал удалён");
    const row = {
      ...n,
      tags: JSON.stringify(n.tags),
      sources: JSON.stringify(n.sources),
      updated: old && old.updated>=t ? new Date(Date.parse(old.updated)+1).toISOString() : t,
    };
    if (old) {
      if (input.updated !== old.updated)
        throw Error("Материал изменился. Откройте актуальную версию.");
      insert("revisions", {
        id: randomUUID(),
        note: key,
        snapshot: JSON.stringify(decodeNote(old)),
        created: t,
      });
      run(
        "UPDATE notes SET " +
          Object.keys(row)
            .map((k) => k + "=?")
            .join(",") +
          " WHERE id=?",
        ...Object.values(row),
        key,
      );
    } else {
      key = randomUUID();
      insert("notes", { id: key, ...row, created: t });
    }
    return key;
  }
  if (!one("PRAGMA user_version").user_version)
    tx(() => {
      db.exec(
        readFileSync(path.join(process.cwd(), "migrations/001.sql"), "utf8"),
      );
      if (seed)
        for (const n of JSON.parse(
          readFileSync(path.join(process.cwd(), "src/seed.json"), "utf8"),
        ))
          saveNote({ ...n, origin: "AI · стартовый материал" });
    });
  function state() {
    return {
      notes: all("SELECT * FROM notes ORDER BY updated DESC,rowid ASC").map(
        decodeNote,
      ),
      links: all("SELECT * FROM links"),
      items: all("SELECT * FROM items ORDER BY updated DESC").map(decodeItem),
      reviews: all("SELECT * FROM reviews ORDER BY created DESC"),
    };
  }
  function mutate(op, p) {
    return tx(() => {
      if (op === "note") return saveNote(p, p.id);
      if (op === "link") {
        const l = linkSchema.parse(p);
        insert("links", { id: randomUUID(), ...l });
        return;
      }
      if (op === "delete") {
        const table = z.enum(["notes", "items", "links"]).parse(p.table);
        run("DELETE FROM " + table + " WHERE id=?", id.parse(p.id));
        return;
      }
      if (op === "item") {
        const v = itemSchema.parse(p);
        const old =
          p.id && one("SELECT * FROM items WHERE id=?", id.parse(p.id));
        if (p.id && (!old || old.kind !== v.kind || old.updated !== p.updated))
          throw Error("Запись изменилась. Откройте её заново.");
        if (v.kind === "card")
          v.details.schedule = old
            ? JSON.parse(old.details).schedule
            : nowCard();
        const row = {
          ...v,
          details: JSON.stringify(v.details),
          updated: stamp(),
        };
        if (old) {
          run(
            "UPDATE items SET title=?,note=?,details=?,updated=? WHERE id=?",
            v.title,
            v.note,
            row.details,
            row.updated,
            p.id,
          );
          return p.id;
        }
        const key = randomUUID();
        insert("items", { id: key, ...row });
        return key;
      }
      if (op === "review") {
        const key = id.parse(p.id),
          rating = z.number().int().min(1).max(4).parse(p.rating),
          c = one("SELECT * FROM items WHERE id=? AND kind='card'", key);
        if (!c) throw Error("Карточка удалена");
        const d = JSON.parse(c.details),
          t = new Date();
        if (new Date(d.schedule.due) > t)
          throw Error("Повторение уже запланировано");
        d.schedule = fsrs().next(d.schedule, t, rating).card;
        run(
          "UPDATE items SET details=?,updated=? WHERE id=?",
          JSON.stringify(d),
          t.toISOString(),
          key,
        );
        insert("reviews", {
          id: randomUUID(),
          card: key,
          rating,
          created: t.toISOString(),
        });
        return;
      }
      throw Error("Неизвестная операция");
    });
  }
  function saveImage(bytes) {
    const mime = imageType(bytes);
    const key = randomUUID();
    insert("assets", { id: key, mime, bytes });
    return "/api/image/" + key;
  }
  function archive() {
    const docs = { version: 1 };
    const files = {};
    for (const t of tables.slice(0, -1)) docs[t] = all("SELECT * FROM " + t);
    docs.assets = [];
    for (const a of all("SELECT * FROM assets")) {
      docs.assets.push({ id: a.id });
      files["images/" + a.id] = a.bytes;
    }
    for (const n of docs.notes)
      files["markdown/" + n.id + ".md"] = strToU8(
        "# " +
          n.title +
          "\n\n" +
          n.body.replaceAll("/api/image/", "../images/") +
          "\n\n" +
          JSON.parse(n.sources).join("\n"),
      );
    files["hub.json"] = strToU8(JSON.stringify(docs, null, 2));
    return zipSync(files);
  }
  function restore(bytes) {
    let sum = 0;
    const files = unzipSync(bytes, {
      filter: (e) => {
        sum += e.originalSize;
        if (sum > 128 * 1024 * 1024) throw Error("Архив слишком велик");
        return e.name === "hub.json" || /^images\/[\da-f-]{36}$/.test(e.name);
      },
    });
    const d = JSON.parse(strFromU8(files["hub.json"]));
    if (d.version !== 1) throw Error("Неизвестная версия архива");
    const date = z.string().datetime();
    return tx(() => {
      for (const t of [...tables].reverse()) run("DELETE FROM " + t);
      for (const raw of d.notes) {
        const n = noteSchema.parse(decodeNote(raw));
        insert("notes", {
          ...n,
          tags: JSON.stringify(n.tags),
          sources: JSON.stringify(n.sources),
          id: id.parse(raw.id),
          created: date.parse(raw.created),
          updated: date.parse(raw.updated),
        });
      }
      for (const r of d.links)
        insert("links", { id: id.parse(r.id), ...linkSchema.parse(r) });
      for (const r of d.items) {
        const raw = decodeItem(r),
          v = itemSchema.parse(raw);
        if (v.kind === "card") {
          const s = raw.details.schedule;
          const valid = z
            .object({
              due: date,
              stability: z.number().nonnegative(),
              difficulty: z.number().nonnegative(),
              scheduled_days: z.number(),
              learning_steps: z.number(),
              reps: z.number().int(),
              lapses: z.number().int(),
              state: z.number().int().min(0).max(3),
              last_review: date.optional(),
            })
            .parse(s);
          v.details.schedule = valid;
        }
        insert("items", {
          ...v,
          id: id.parse(r.id),
          updated: date.parse(r.updated),
          details: JSON.stringify(v.details),
        });
      }
      for (const r of d.revisions) {
        const snapshot = noteSchema
          .extend({
            id: id.optional(),
            created: date.optional(),
            updated: date.optional(),
          })
          .parse(JSON.parse(r.snapshot));
        insert("revisions", {
          id: id.parse(r.id),
          note: id.parse(r.note),
          created: date.parse(r.created),
          snapshot: JSON.stringify(snapshot),
        });
      }
      for (const r of d.reviews)
        insert("reviews", {
          id: id.parse(r.id),
          card: id.parse(r.card),
          rating: z.number().int().min(1).max(4).parse(r.rating),
          created: date.parse(r.created),
        });
      for (const a of d.assets) {
        const key = id.parse(a.id),
          data = files["images/" + key];
        insert("assets", { id: key, bytes: data, mime: imageType(data) });
      }
    });
  }
  return {
    db,
    tx,
    state,
    mutate,
    saveImage,
    archive,
    restore,
    history: (key) =>
      all("SELECT * FROM revisions WHERE note=? ORDER BY created DESC", key),
    image: (key) => one("SELECT * FROM assets WHERE id=?", key),
    search(q) {
      const words = q.match(/[\p{L}\p{N}_]+/gu)?.slice(0, 16);
      return words
        ? all(
            "SELECT id FROM search WHERE search MATCH ? ORDER BY rank",
            words.map((w) => '"' + w + '"*').join(" AND "),
          ).map((r) => r.id)
        : [];
    },
  };
}
function imageType(data) {
  if (!data || data.length > 5 * 1024 * 1024)
    throw Error("Изображение должно быть меньше 5 МБ");
  const b = Buffer.from(data);
  if (b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")))
    return "image/png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  throw Error("Поддерживаются PNG, JPEG и WebP");
}
export const dbPath = () =>
  path.resolve(process.env.HUB_DB || "data/hub.sqlite");
export function hub() {
  return (globalThis.__engineeringHub ??= openStore(dbPath()));
}
