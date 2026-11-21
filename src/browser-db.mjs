import Dexie from "dexie";
import MiniSearch from "minisearch";
import { fsrs, createEmptyCard } from "ts-fsrs";
import {
  schemas,
  noteFields,
  itemFields,
  topicFields,
  flags,
  mastery,
  tableNames,
  validateImage,
} from "./contracts.mjs";
const uid = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
  asJSON = (x) => JSON.parse(JSON.stringify(x));
export function database(name) {
  const db = new Dexie(name);
  db.version(1).stores({
    notes: "id,updated",
    items: "id,note,kind",
    links: "id,source,target,&[source+target]",
    revisions: "id,note",
    reviews: "id,card",
    assets: "id",
    meta: "id",
  });
  db.version(2).stores({
    topics: "id,area",
    marks: "id,topic",
    exams: "id,topic",
    events: "id,created",
    topicNotes: "id,topic,note,&[topic+note]",
  });
  return db;
}
export async function install(db, seed, topics, release) {
  await db.transaction("rw", [db.notes, db.topics, db.meta], async () => {
    if (!(await db.meta.get("initial-notes"))) {
      for (const [i, n] of seed.entries()) {
        const t = now();
        await db.notes.put({
          ...noteFields.parse({ ...n, origin: "AI · стартовый материал" }),
          id: "starter-" + i,
          created: t,
          updated: t,
        });
      }
      await db.meta.put({ id: "initial-notes", value: true });
    }
    if ((await db.meta.get("syllabus-release"))?.value !== release) {
      for (const t of topics) {
        const old = await db.topics.get(t.id);
        if (!old?.edited)
          await db.topics.put(
            topicFields.parse({ ...t, hidden: old?.hidden || false }),
          );
      }
      await db.meta.put({ id: "syllabus-release", value: release });
    }
  });
}
export async function state(db) {
  const [notes, items, links, reviews] = await Promise.all([
    db.notes.orderBy("updated").reverse().toArray(),
    db.items.toArray(),
    db.links.toArray(),
    db.reviews.toArray(),
  ]);
  return {
    notes,
    items: items.sort((a, b) => b.updated.localeCompare(a.updated)),
    links,
    reviews: reviews.sort((a, b) => b.created.localeCompare(a.created)),
  };
}
export async function roadmap(db) {
  const [topics, marks, exams, events, topicNotes] = await Promise.all(
    ["topics", "marks", "exams", "events", "topicNotes"].map((t) =>
      db.table(t).toArray(),
    ),
  );
  return {
    topics,
    marks,
    exams: exams.sort((a, b) => b.created.localeCompare(a.created)),
    events: events.sort((a, b) => a.created.localeCompare(b.created)),
    topicNotes,
  };
}
function concurrencyTerms(note) {
  const title = [note.title, ...note.tags].join(" ");
  return /multithread|concurren|thread|happens.before|atomic operations|synchronization primitives|race conditions|livelock|starvation|deadlock|reentrantlock|многопоточ|виртуальные потоки/i.test(title)
    ? "многопоточность многопоточка concurrency multithreading"
    : "";
}
export async function search(db, q) {
  const index = new MiniSearch({
    fields: [
      "title",
      "category",
      "body",
      "tags",
      "practice",
      "explanation",
      "prompt",
      "english",
    ],
  });
  index.addAll(
    (await db.notes.toArray()).map((n) => ({ ...n, tags: [...n.tags, concurrencyTerms(n)].join(" ") })),
  );
  return index
    .search(q.replace(/многопточ[а-яё]*/gi, "многопоточность"), { prefix: true, combineWith: "AND", boost: { title: 3 } })
    .map((r) => r.id);
}
const latest = (p, old) => {
  if (!old || old.updated !== p.updated)
    throw Error("Запись изменилась. Откройте её заново.");
};
async function requireRow(table, id) {
  if (!(await table.get(id))) throw Error("Связанная запись отсутствует");
}
async function snapshot(db) {
  const stats = mastery(await db.topics.toArray(), await db.marks.toArray());
  await db.events.add({
    id: uid(),
    created: now(),
    mastered: stats.mastered,
    total: stats.total,
  });
}
function nextStamp(time,old){return old && time<=old.updated?new Date(Date.parse(old.updated)+1).toISOString():time}
export async function mutate(db, op, p) {
  return db.transaction("rw", db.tables, async () => {
    const t = now();
    if (op === "note") {
      const d = noteFields.parse(p),
        id = p.id || uid(),
        old = await db.notes.get(id);
      if (p.id) {
        latest(p, old);
        await db.revisions.add({
          id: uid(),
          note: id,
          created: t,
          snapshot: JSON.stringify(old),
        });
      }
      await db.notes.put({ ...d, id, created: old?.created || t, updated: nextStamp(t,old) });
      if (p.topic) {
        await requireRow(db.topics, p.topic);
        await db.topicNotes.add({ id: uid(), topic: p.topic, note: id });
      }
      return id;
    }
    if (op === "item") {
      const d = itemFields.parse(p),
        id = p.id || uid(),
        old = await db.items.get(id);
      if (p.id) {
        latest(p, old);
        if (old.kind !== d.kind) throw Error("Тип записи изменился");
      }
      if (d.note) await requireRow(db.notes, d.note);
      if (d.kind === "card")
        d.details.schedule = old?.details.schedule || asJSON(createEmptyCard());
      await db.items.put({ ...d, id, updated: nextStamp(t,old) });
      return id;
    }
    if (op === "review") {
      const c = await db.items.get(p.id);
      if (
        c?.kind !== "card" ||
        ![1, 2, 3, 4].includes(p.rating) ||
        Date.parse(c.details.schedule.due) > Date.now()
      )
        throw Error("Карточка недоступна для повторения");
      c.details.schedule = asJSON(
        fsrs().next(c.details.schedule, new Date(), p.rating).card,
      );
      await db.items.put({ ...c, updated: t });
      await db.reviews.add({
        id: uid(),
        card: c.id,
        rating: p.rating,
        created: t,
      });
      return;
    }
    if (op === "link") {
      await requireRow(db.notes, p.source);
      await requireRow(db.notes, p.target);
      await db.links.add(schemas.links.parse({ ...p, id: uid() }));
      return;
    }
    if (op === "delete") {
      if (!["items", "notes", "links"].includes(p.table))
        throw Error("Некорректный запрос");
      if (p.table === "notes") {
        await db.revisions.where("note").equals(p.id).delete();
        await db.links
          .where("source")
          .equals(p.id)
          .or("target")
          .equals(p.id)
          .delete();
        await db.topicNotes.where("note").equals(p.id).delete();
        await db.items
          .where("note")
          .equals(p.id)
          .modify({ note: null, updated: t });
      }
      if (p.table === "items")
        await db.reviews.where("card").equals(p.id).delete();
      await db.table(p.table).delete(p.id);
      return;
    }
    if (op === "topic") {
      const id = p.id || uid(),
        old = await db.topics.get(id),
        value = topicFields.parse({
          ...p,
          id,
          custom: old ? old.custom : true,
          edited: true,
        });
      await db.topics.put(value);
      await snapshot(db);
      return id;
    }
    if (op === "hide") {
      await requireRow(db.topics, p.id);
      await db.topics.update(p.id, { hidden: !!p.hidden });
      await snapshot(db);
      return;
    }
    if (op === "attach") {
      await requireRow(db.topics, p.topic);
      await requireRow(db.notes, p.note);
      await db.topicNotes.add(schemas.topicNotes.parse({ ...p, id: uid() }));
      return;
    }
    if (op === "mark") {
      const topic = await db.topics.get(p.topic);
      if (!topic?.skills.some((sk) => sk.id === p.skill))
        throw Error("Навык отсутствует");
      const id = p.topic + "." + p.skill;
      const old = (await db.marks.get(id)) || {
        id,
        topic: p.topic,
        skill: p.skill,
        flags: ["unstarted"],
        repeat: false,
        checked: null,
      };
      if (p.field === "repeat") old.repeat = !!p.value;
      else if (p.field === "checked") old.checked = t;
      else if (flags.includes(p.field)) {
        const set = new Set(old.flags);
        if (p.value) set.add(p.field);
        else set.delete(p.field);
        if (p.field !== "unstarted" && p.value) set.delete("unstarted");
        old.flags = [...set];
        if (["explain", "practice", "english"].includes(p.field) && p.value)
          old.checked = t;
      } else throw Error("Неизвестный статус");
      await db.marks.put(schemas.marks.parse({ ...old, updated: t }));
      await snapshot(db);
      return;
    }
    if (op === "exam") {
      const topic = await db.topics.get(p.topic);
      if (!topic) throw Error("Тема отсутствует");
      await db.exams.add(
        schemas.exams.parse({
          ...p,
          id: uid(),
          question: topic.question,
          answer: topic.answer,
          created: t,
        }),
      );
      return;
    }
    throw Error("Неизвестная операция");
  });
}
export async function saveAsset(db, file) {
  if (file.size > 5 * 1024 * 1024) throw Error("Максимум 5 МБ");
  const bytes = new Uint8Array(await file.arrayBuffer()),
    mime = validateImage(bytes),
    id = uid();
  await db.assets.add({ id, mime, base64: encode(bytes) });
  return { url: "/api/image/" + id };
}
export function encode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 32768)
    s += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(s);
}
export const decode = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const progressNames = ["marks", "exams", "events", "reviews"];
export async function pack(db, scope = "all") {
  return db.transaction("r", db.tables, async () => {
    const data = {};
    for (const t of scope === "progress" ? progressNames : tableNames)
      data[t] = await db.table(t).toArray();
    if (scope === "progress") {
      data.notes = (await db.notes.toArray()).map(({ id, status, level }) => ({
        id,
        status,
        level,
      }));
      data.items = (await db.items.toArray())
        .filter((i) => ["question", "card"].includes(i.kind))
        .map((i) => ({
          id: i.id,
          kind: i.kind,
          details: Object.fromEntries(
            ["score", "gap", "schedule"]
              .filter((k) => i.details[k] !== undefined)
              .map((k) => [k, i.details[k]]),
          ),
        }));
      data.topics = (await db.topics.toArray()).filter(
        (t) => t.custom || t.edited,
      );
    }
    return { format: "engineering-knowledge-hub", version: 2, scope, data };
  });
}
export async function merge(db, doc, replace = false) {
  if (
    doc?.format !== "engineering-knowledge-hub" ||
    doc.version !== 2 ||
    !["all", "progress"].includes(doc.scope) ||
    !doc.data
  )
    throw Error("Неизвестный формат или версия копии");
  return db.transaction("rw", db.tables, async () => {
    let added = 0,
      conflicts = 0,
      skipped = 0;
    const progress = doc.scope === "progress";
    for (const t of progress
      ? ["topics", "marks", "exams", "events", "notes", "items", "reviews"]
      : tableNames) {
      const list = doc.data[t];
      if (!Array.isArray(list)) throw Error("Отсутствует таблица " + t);
      for (const raw of list) {
        const old = await db.table(t).get(raw.id);
        if (progress && ["notes", "items"].includes(t)) {
          if (!old) {
            skipped++;
            continue;
          }
          if (
            t === "items" &&
            (old.kind !== raw.kind || !["question", "card"].includes(old.kind))
          )
            throw Error("Несовместимый тип записи");
          const candidate =
            t === "notes"
              ? { ...old, status: raw.status, level: raw.level }
              : {
                  ...old,
                  details: {
                    ...old.details,
                    ...Object.fromEntries(
                      Object.entries(raw.details).filter(([k]) =>
                        ["score", "gap", "schedule"].includes(k),
                      ),
                    ),
                  },
                };
          const value = schemas[t].parse(candidate);
          if (JSON.stringify(old) !== JSON.stringify(value)) {
            conflicts++;
            if (replace) await db.table(t).put({ ...value, updated: now() });
          }
          continue;
        }
        const value = schemas[t].parse(raw);
        if (
          t === "assets" &&
          validateImage(decode(value.base64)) !== value.mime
        )
          throw Error("Некорректное изображение");
        if (t === "revisions") noteFields.parse(JSON.parse(value.snapshot));
        if (t === "reviews" && progress && !(await db.items.get(value.card))) {
          skipped++;
          continue;
        }
        if (!old) {
          await db.table(t).add(value);
          added++;
        } else if (JSON.stringify(old) !== JSON.stringify(value)) {
          conflicts++;
          if (replace) await db.table(t).put(value);
        }
      }
    }
    const notes = new Set(await db.notes.toCollection().primaryKeys()),
      topics = new Set(await db.topics.toCollection().primaryKeys()),
      cards = new Set(
        (await db.items.where("kind").equals("card").toArray()).map(
          (i) => i.id,
        ),
      );
    const bad = () => {
      throw Error("В копии найдена ссылка на отсутствующую запись");
    };
    for (const l of await db.links.toArray())
      if (!notes.has(l.source) || !notes.has(l.target)) bad();
    for (const i of await db.items.toArray())
      if (i.note && !notes.has(i.note)) bad();
    for (const l of await db.topicNotes.toArray())
      if (!topics.has(l.topic) || !notes.has(l.note)) bad();
    for (const r of await db.revisions.toArray()) if (!notes.has(r.note)) bad();
    for (const r of await db.reviews.toArray()) if (!cards.has(r.card)) bad();
    for (const t of ["marks", "exams"])
      for (const r of await db.table(t).toArray())
        if (!topics.has(r.topic)) bad();
    return { added, conflicts, skipped };
  });
}
export async function reset(db) {
  return db.transaction("rw", db.tables, async () => {
    for (const t of progressNames) await db.table(t).clear();
    await db.notes
      .toCollection()
      .modify({ status: "To Learn", level: 0, updated: now() });
    await db.items.toCollection().modify((i) => {
      if (i.kind === "card") i.details.schedule = asJSON(createEmptyCard());
      if (i.kind === "question") {
        delete i.details.score;
        i.details.gap = "";
      }
      i.updated = now();
    });
  });
}
