import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "../../../src/articles/concurrency";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
hljs.registerLanguage("java", java);
export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const a = articles.find((v) => v.slug === slug);
  return {
    title: a?.title + " · Engineering Knowledge Hub",
    description: a?.lead,
  };
}
export default async function Article({ params }: Props) {
  const { slug } = await params;
  const index = articles.findIndex((a) => a.slug === slug);
  if (index < 0) notFound();
  const a = articles[index],
    next = articles[index + 1];
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">Engineering Knowledge Hub</Link> /{" "}
        <Link href="/concurrency/">Многопоточность</Link>
      </nav>
      <article>
        <header>
          <small>{a.group} · Java 21</small>
          <h1>{a.title}</h1>
          <p>{a.lead}</p>
        </header>
        <div className="article-body">
          <p>{a.scenario}</p>
          <pre>
            <code
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(a.code, { language: "java" }).value,
              }}
            />
          </pre>
          <p>{a.analysis}</p>
          <section className="panel road-panel">
            <h2>Вопрос для самопроверки</h2>
            <p>{a.question}</p>
            <details>
              <summary>Сверить ответ</summary>
              <p>{a.answer}</p>
            </details>
          </section>
          <p>
            <a href={a.source} rel="noreferrer" target="_blank">
              Первоисточник ·{" "}
              {a.source.includes("openjdk.org")
                ? "OpenJDK"
                : a.source.includes("jls")
                  ? "Java Language Specification"
                  : "Java 21 API"}
            </a>
          </p>
          {a.ticket && (
            <Link href={"/#roadmap/" + a.ticket}>
              Проверить навык в Learning Roadmap
            </Link>
          )}
        </div>
      </article>
      <footer>
        <Link href="/concurrency/">Все статьи</Link>
        {next && (
          <Link href={"/concurrency/" + next.slug + "/"}>
            Далее · {next.title}
          </Link>
        )}
      </footer>
    </main>
  );
}
