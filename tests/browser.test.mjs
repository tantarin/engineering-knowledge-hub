import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  database,
  install,
  mutate,
  state,
  roadmap,
  pack,
  merge,
  reset,
  search,
  saveAsset,
} from "../src/browser-db.mjs";
import { mastery } from "../src/contracts.mjs";
import Dexie from "dexie";
const syllabus = JSON.parse(readFileSync("public/syllabus.json")),
  n = { title: "MVCC", category: "PostgreSQL", body: "Изоляция снимков" };
const topic = syllabus.topics.find(
  (t) => t.area === "PostgreSQL" && t.title === "Repeatable Read",
);
async function fresh() {
  const db = database(crypto.randomUUID());
  await install(db, [], [topic], "v1");
  return db;
}
test("syllabus has breadth, real scenarios and stable unique topic/skill identities", () => {
  assert.ok(syllabus.topics.length >= 100);
  assert.ok(new Set(syllabus.topics.map((t) => t.area)).size >= 10);
  assert.equal(topic.section, "Transactions");
  assert.equal(topic.subsection, "Isolation Levels");
  assert.ok(
    syllabus.topics.every(
      (t) => t.skills.length >= 3 && t.criteria.length >= 3 && t.sources.length,
    ),
  );
});
test("IndexedDB version upgrade preserves existing notes", async () => {
  const name = crypto.randomUUID(),
    first = new Dexie(name);
  first
    .version(1)
    .stores({
      notes: "id,updated",
      items: "id,note,kind",
      links: "id,source,target,&[source+target]",
      revisions: "id,note",
      reviews: "id,card",
      assets: "id",
      meta: "id",
    });
  await first.notes.add({ ...n, id: "existing" });
  first.close();
  const db = database(name);
  await install(db, [], [topic], "new");
  assert.equal((await db.notes.get("existing")).body, n.body);
  await db.delete();
});
test("exam, independent flags, reload, curriculum update and preservation of user edits", async () => {
  let db = await fresh();
  const sk = topic.skills[0];
  for (const field of ["theory", "explain", "practice", "english"])
    await mutate(db, "mark", {
      topic: topic.id,
      skill: sk.id,
      field,
      value: true,
    });
  await mutate(db, "exam", {
    topic: topic.id,
    response: "Мой ответ",
    result: "partial",
  });
  const before = await roadmap(db);
  assert.equal(
    mastery(before.topics, before.marks).unchecked,
    topic.skills.length - 1,
  );
  assert.equal(mastery(before.topics, before.marks).mastered, 0);
  assert.equal(before.marks[0].flags.length, 4);
  const name = db.name;
  db.close();
  db = database(name);
  await install(db, [], [{ ...topic, theory: "Обновлённый разбор" }], "v2");
  assert.deepEqual((await roadmap(db)).marks, before.marks);
  assert.equal((await db.exams.toArray())[0].response, "Мой ответ");
  await mutate(db, "topic", { ...topic, title: "Личный вариант" });
  await install(db, [], [topic], "v3");
  assert.equal((await db.topics.get(topic.id)).title, "Личный вариант");
  await db.delete();
});
test("FTS, optimistic updates, portable all/progress backup, FSRS, transactional rejection and reset", async () => {
  const db = await fresh(),
    other = await fresh(),
    id = await mutate(db, "note", { ...n, topic: topic.id }),
    old = await db.notes.get(id);
  await mutate(db, "note", { ...old, level: 2 });
  await assert.rejects(mutate(db, "note", { ...old, title: "Конфликт" }));
  assert.deepEqual(await search(db, "Изоляц"), [id]);
  const card = await mutate(db, "item", {
    kind: "card",
    title: "Снимок?",
    note: id,
    details: { answer: "Ответ" },
  });
  await mutate(db, "review", { id: card, rating: 3 });
  await assert.rejects(mutate(db, "review", { id: card, rating: 3 }));
  await mutate(db, "mark", {
    topic: topic.id,
    skill: topic.skills[0].id,
    field: "practice",
    value: true,
  });
  await saveAsset(
    db,
    new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "base64")]),
  );
  const doc = await pack(db);
  await merge(other, doc);
  assert.deepEqual(await state(other), await state(db));
  assert.equal(await other.assets.count(), 1);
  const progress = await pack(db, "progress");
  assert.ok(!JSON.stringify(progress).includes("Изоляция снимков"));
  await reset(other);
  assert.equal(await other.exams.count(), 0);
  assert.equal(await other.notes.count(), 1);
  await merge(other, progress, true);
  assert.deepEqual(await db.marks.toArray(), await other.marks.toArray());
  const bad = structuredClone(doc);
  bad.data.notes.push({ ...old, id: "other-id" });
  bad.data.topicNotes.push({
    id: "bad-link",
    topic: topic.id,
    note: "missing",
  });
  await assert.rejects(merge(other, bad));
  assert.equal(await other.notes.get("other-id"), undefined);
  await db.delete();
  await other.delete();
});
