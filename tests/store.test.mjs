import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openStore } from "../src/store.mjs";
import { zipSync, strToU8 } from "fflate";
const note = (s, title) =>
  s.mutate("note", {
    title,
    category: "PostgreSQL",
    body: "Снимок транзакции",
  });
test("FTS, версии, конфликт и сохранение после перезапуска", () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "hub-")), "db.sqlite");
  let s = openStore(file, false);
  const id = note(s, "MVCC");
  assert.deepEqual(s.search("сним тра"), [id]);
  const n = s.state().notes[0];
  s.mutate("note", { ...n, body: "Видимость версий" });
  assert.throws(() => s.mutate("note", { ...n, body: "устарело" }));
  assert.deepEqual(s.search("сним"), []);
  assert.equal(s.history(id).length, 1);
  s.db.close();
  s = openStore(file, false);
  assert.deepEqual(s.search("видим"), [id]);
  s.db.close();
});
test("связи проверяются, удаление сохраняет самостоятельную карточку", () => {
  const s = openStore(":memory:", false),
    a = note(s, "A"),
    b = note(s, "B");
  s.mutate("link", { source: a, target: b, label: "Основание" });
  assert.throws(() =>
    s.mutate("link", { source: a, target: a, label: "Цикл" }),
  );
  s.mutate("item", { title: "Вопрос", kind: "card", note: a });
  s.mutate("delete", { table: "notes", id: a });
  assert.equal(s.state().links.length, 0);
  assert.equal(s.state().items[0].note, null);
});
test("FSRS, повторная отправка и полный перенос архива", () => {
  const s = openStore(":memory:", false),
    n = note(s, "MVCC"),
    c = s.mutate("item", {
      title: "Снимок?",
      kind: "card",
      note: n,
      details: { answer: "Ответ" },
    });
  s.mutate("review", { id: c, rating: 3 });
  assert.equal(s.state().items[0].details.schedule.reps, 1);
  assert.throws(() => s.mutate("review", { id: c, rating: 3 }));
  const uri = s.saveImage(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+mTt8AAAAASUVORK5CYII=",
      "base64",
    ),
  );
  assert.throws(() => s.saveImage(Buffer.from("<svg/>")));
  const copy = openStore(":memory:", false);
  copy.restore(s.archive());
  assert.deepEqual(copy.state(), s.state());
  assert.deepEqual(
    copy.image(uri.split("/").pop()),
    s.image(uri.split("/").pop()),
  );
  assert.deepEqual(copy.search("MVCC"), [n]);
});
test("ошибка импорта откатывает замену всей базы", () => {
  const s = openStore(":memory:", false),
    id = note(s, "Исходный");
  assert.throws(() =>
    s.restore(
      zipSync({
        "hub.json": strToU8(
          JSON.stringify({ version: 1, notes: [{ id: "bad" }] }),
        ),
      }),
    ),
  );
  assert.equal(s.state().notes[0].id, id);
});
test("недопустимые ссылки отклоняются до записи", () => {
  const s = openStore(":memory:", false);
  assert.throws(() =>
    s.mutate("note", {
      title: "A",
      category: "B",
      sources: ["javascript:alert(1)"],
    }),
  );
  assert.equal(s.state().notes.length, 0);
});
