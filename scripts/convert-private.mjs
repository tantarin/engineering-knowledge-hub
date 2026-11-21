// Offline conversion of a pre-Pages SQLite workspace. Output stays outside the public tree.
import { writeFileSync, mkdirSync } from "node:fs";
import { dbPath, openStore } from "../src/store.mjs";
import { schemas, tableNames } from "../src/contracts.mjs";
import path from "node:path";
const db = openStore(dbPath(), false),
  data = Object.fromEntries(tableNames.map((t) => [t, []])),
  state = db.state();
Object.assign(data, state);
data.notes = data.notes.filter(
  (n) =>
    !n.origin.startsWith("AI ·") ||
    n.status !== "To Learn" ||
    n.explanation ||
    n.practice ||
    state.links.some((l) => l.source === n.id || l.target === n.id) ||
    state.items.some((i) => i.note === n.id) ||
    db.history(n.id).length,
);
data.revisions = data.notes.flatMap((n) => db.history(n.id));
data.assets = db.db
  .prepare("select * from assets")
  .all()
  .map((a) => ({
    id: a.id,
    mime: a.mime,
    base64: Buffer.from(a.bytes).toString("base64"),
  }));
for (const [k, rows] of Object.entries(data))
  for (const r of rows) schemas[k].parse(r);
const dest = path.join(path.dirname(dbPath()), "engineering-hub-personal.json");
writeFileSync(
  dest,
  JSON.stringify({
    format: "engineering-knowledge-hub",
    scope: "all",
    version: 2,
    data,
  }),
  { mode: 0o600 },
);
console.log(dest, data.notes.length, "notes", data.assets.length, "images");
