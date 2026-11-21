import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (name) =>
  JSON.parse(
    readFileSync(
      new URL("../src/articles/career-" + name + ".json", import.meta.url),
    ),
  );
test("Every career material has an independently addressable article", () => {
  const pages = ["guide", "java", "data", "design"].flatMap(read);
  assert.ok(pages.length >= 106);
  assert.equal(new Set(pages.map((p) => p.num)).size, pages.length);
  assert.equal(new Set(pages.map((p) => p.slug)).size, pages.length);
  for (let num = 0; num < 106; num++)
    assert.ok(
      pages.some((p) => p.num === num),
      "Missing material " + num,
    );
  for (const p of pages) {
    assert.match(p.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(p.title && p.summary && p.body.length > 350, p.slug);
    assert.doesNotMatch(p.body, /file:\/\/|\/Users\/|\[\[/);
  }
  const ids = new Set(pages.map((p) => p.num));
  for (const [from, to] of Object.entries(read("links"))) {
    assert.ok(ids.has(+from));
    for (const num of to) assert.ok(ids.has(num));
  }
});

test("reading tracks cover every article exactly once and preserve prerequisites", () => {
  const chapters = JSON.parse(
    readFileSync(
      new URL("../src/articles/reading-order.json", import.meta.url),
    ),
  );
  const all = ["guide", "java", "data", "design"]
    .flatMap(read)
    .map((a) => a.slug);
  const route = chapters.flatMap((c) => c.lessons);
  assert.deepEqual([...route].sort(), all.sort());
  assert.equal(new Set(chapters.map((c) => c.id)).size, chapters.length);
  for (const [before, after] of [
    ["threads-and-processes", "thread-pools"],
    ["parallel-data-processing", "fork-join-pool"],
    ["mvcc-visible-version", "postgres-rr-conflicts"],
    ["dual-write-failure-matrix", "transactional-outbox-lifecycle"],
  ])
    assert.ok(route.indexOf(before) < route.indexOf(after));
});

test("All five Revolut stages have separate preparation routes and a rehearsal", () => {
  const stages = JSON.parse(readFileSync(new URL("../src/articles/interview-stages.json", import.meta.url)));
  const pages = new Set(["guide", "java", "data", "design"].flatMap(read).map(a => a.slug));
  assert.deepEqual(stages.map(stage => stage.id), ["recruiter", "java-live-coding", "system-design", "team-fit", "offer-call"]);
  for (const stage of stages) {
    assert.ok(stage.exercise && stage.checks.length && stage.lessons.length);
    for (const lesson of stage.lessons) assert.ok(pages.has(lesson.slug) && lesson.task);
  }
});
