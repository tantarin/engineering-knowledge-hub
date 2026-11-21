import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPath, hub } from "./store.mjs";
export function backup() {
  const dir = path.join(path.dirname(dbPath()), "backups");
  mkdirSync(dir, { recursive: true });
  const file = path.join(
    dir,
    new Date().toISOString().replaceAll(":", "-") + ".zip",
  );
  writeFileSync(file, hub().archive(), { flag: "wx", mode: 0o600 });
  return file;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(backup());
