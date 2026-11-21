"use client";
import { useEffect, useId, useState } from "react";
import { imageBlob } from "./client";
import Markdown from "react-markdown";
import gfm from "remark-gfm";
import math from "remark-math";
import katex from "rehype-katex";
import hljs from "highlight.js/lib/core";
import sql from "highlight.js/lib/languages/sql";
import scala from "highlight.js/lib/languages/scala";
import java from "highlight.js/lib/languages/java";
import "katex/dist/katex.min.css";
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("java", java);
hljs.registerLanguage("scala", scala);
function Diagram({ source }: { source: string }) {
  const key = useId().replace(/[^A-Za-z0-9]/g, ""),
    [svg, set] = useState(""),
    [error, err] = useState(false);
  useEffect(() => {
    let live = true;
    set("");
    err(false);
    (async () => {
      const m = (await import("mermaid")).default;
      m.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "neutral",
      });
      const r = await m.render(
        "m" + key + crypto.randomUUID().replaceAll("-", ""),
        source,
      );
      if (live) set(r.svg);
    })().catch(() => live && err(true));
    return () => {
      live = false;
    };
  }, [source, key]);
  return svg ? (
    <img
      className="diagram"
      alt="Mermaid-диаграмма"
      src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)}
    />
  ) : (
    <code>{error ? "Проверьте синтаксис Mermaid" : source}</code>
  );
}
function Asset({ src, alt }: { src: string; alt: string }) {
  const [url, U] = useState("");
  useEffect(() => {
    let live = true,
      local = "";
    imageBlob(src.split("/").pop()).then((b) => {
      if (b && live) {
        local = URL.createObjectURL(b);
        U(local);
      }
    });
    return () => {
      live = false;
      if (local) URL.revokeObjectURL(local);
    };
  }, [src]);
  return url ? <img src={url} alt={alt} /> : <span>{alt}</span>;
}
export default function MD({ text }: { text: string }) {
  return (
    <div className="md">
      <Markdown
        remarkPlugins={[gfm, math]}
        rehypePlugins={[katex]}
        components={{
          img: ({ src, alt }) =>
            typeof src === "string" &&
            /^\/api\/image\/[a-f0-9-]+$/.test(src) ? (
              <Asset src={src} alt={alt || "Иллюстрация"} />
            ) : (
              <span>{alt || "Изображение"}</span>
            ),
          code: ({ children, className }) => {
            const lang = className?.replace("language-", ""),
              code = String(children);
            if (lang === "mermaid") return <Diagram source={code} />;
            return lang && hljs.getLanguage(lang) ? (
              <code
                dangerouslySetInnerHTML={{
                  __html: hljs.highlight(code, { language: lang }).value,
                }}
              />
            ) : (
              <code>{children}</code>
            );
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
