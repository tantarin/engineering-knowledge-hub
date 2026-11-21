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
