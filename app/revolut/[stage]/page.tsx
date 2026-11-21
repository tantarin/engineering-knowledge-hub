import Link from "next/link";
import { notFound } from "next/navigation";
import stages from "../../../src/articles/interview-stages.json";
import { library } from "../../../src/articles/library";
import { siteName } from "../../../src/identity";
export const dynamicParams = false;
export function generateStaticParams() {
  return stages.map((s) => ({ stage: s.id }));
}
type Props = { params: Promise<{ stage: string }> };
export async function generateMetadata({ params }: Props) {
  const id = (await params).stage;
  const s = stages.find((s) => s.id === id);
  return { title: s?.title + " · Revolut", description: s?.goal };
}
export default async function StagePage({ params }: Props) {
  const id = (await params).stage,
    stage = stages.find((s) => s.id === id);
  if (!stage) notFound();
  const other = stages.find((s) => s.id !== id)!;
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">{siteName}</Link> /{" "}
        <Link href="/articles/">Учебный маршрут</Link> / Revolut
      </nav>
      <header>
        <small>{stage.label} · Revolut</small>
        <h1>{stage.title}</h1>
        <p>{stage.goal}</p>
      </header>
      <section>
        <h2>Как проходит этап</h2>
        <p>
          {stage.format}{" "}
          <a href="https://www.revolut.com/blog/post/how-to-ace-your-java-interview-at-revolut/">
            Руководство Revolut, 31 марта 2025
          </a>
        </p>
      </section>
      <section>
        <h2>Порядок подготовки</h2>
        <ol className="stage-lessons">
          {stage.lessons.map((l) => {
            const article = library.find((a) => a.slug === l.slug)!;
            return (
              <li key={l.slug}>
                <Link
                  href={{
                    pathname: "/articles/" + l.slug + "/",
                    query: { stage: id },
                  }}
                >
                  {article.title}
                </Link>
                <p>{l.task}</p>
              </li>
            );
          })}
        </ol>
      </section>
      <section id="practice" className="panel road-panel">
        <h2>Репетиция</h2>
        <p>{stage.exercise}</p>
        <h3>Что проверить после</h3>
        <ul>
          {stage.checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <footer>
        <Link href="/articles/">Учебный маршрут</Link>
        <Link href={"/revolut/" + other.id + "/"}>
          {other.label} · {other.title}
        </Link>
      </footer>
    </main>
  );
}
