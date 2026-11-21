import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("out"),
  base = process.env.PAGES_BASE_PATH || "",
  port = Number(process.env.PORT || 3184);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
};
createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!name.startsWith(base + "/")) throw Error();
    let target = path.resolve(root, "." + name.slice(base.length));
    if (target !== root && !target.startsWith(root + path.sep)) throw Error();
    if ((await stat(target)).isDirectory())
      target = path.join(target, "index.html");
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(await readFile(target));
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
}).listen(port, "127.0.0.1", () =>
  console.log("http://127.0.0.1:" + port + base + "/"),
);
