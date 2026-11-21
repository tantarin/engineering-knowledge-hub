import seed from "./seed.json";
import {
  database,
  install,
  state,
  roadmap,
  search,
  mutate,
  saveAsset,
  decode,
  pack,
  merge,
  reset,
} from "./browser-db.mjs";
const dbName =
  "engineering-knowledge-hub" + (process.env.NEXT_PUBLIC_BASE_PATH || "/");
let ready: Promise<any>,
  context: any[] = [];
export async function databaseReady() {
  if (!ready) {
    ready = (async () => {
      const db = database(dbName);
      const response = await fetch(
        (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/syllabus.json",
      );
      if (!response.ok) throw Error("Не удалось загрузить программу");
      const { release, topics, contexts } = await response.json();
      context = contexts;
      await install(db, seed, topics, release);
      return db;
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  }
  return ready;
}
export async function api(path: string, data?: any) {
  const db = await databaseReady();
  if (!path) return state(db);
  if (path === "/roadmap") return { ...(await roadmap(db)), contexts: context };
  if (path.startsWith("/search?"))
    return search(db, new URLSearchParams(path.split("?")[1]).get("q"));
  if (path.startsWith("/history/"))
    return (
      await db.revisions.where("note").equals(path.split("/").pop()).toArray()
    ).sort((a, b) => b.created.localeCompare(a.created));
  if (path === "/upload") return saveAsset(db, data);
  return { id: await mutate(db, path.slice(1), data) };
}
export async function imageBlob(id: string) {
  const db = await databaseReady(),
    a = await db.assets.get(id);
  return a && new Blob([decode(a.base64)], { type: a.mime });
}
export function download(name: string, blob: Blob) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 30000);
}
export async function backup(scope: string) {
  download(
    "engineering-hub-" +
      scope +
      "-" +
      new Date().toISOString().slice(0, 10) +
      ".json",
    new Blob([JSON.stringify(await pack(await databaseReady(), scope))], {
      type: "application/json",
    }),
  );
}
export async function restore(file: File, replace: boolean) {
  if (file.size > 128 * 1024 * 1024) throw Error("Архив превышает 128 МБ");
  return merge(await databaseReady(), JSON.parse(await file.text()), replace);
}
export async function resetProgress() {
  await reset(await databaseReady());
}
export async function markdownExport() {
  const { zipSync, strToU8 } = await import("fflate"),
    db = await databaseReady(),
    files = {};
  for (const n of await db.notes.toArray())
    files["markdown/" + n.id + ".md"] = strToU8(
      "# " +
        n.title +
        "\n\n" +
        n.body.replaceAll("/api/image/", "../images/") +
        "\n\n" +
        n.sources.join("\n"),
    );
  for (const a of await db.assets.toArray())
    files["images/" + a.id] = decode(a.base64);
  download(
    "engineering-hub-markdown.zip",
    new Blob([new Uint8Array(zipSync(files))]),
  );
}
