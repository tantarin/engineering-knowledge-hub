import { siteName } from "../../../src/identity";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  library,
  related,
  readingPosition,
} from "../../../src/articles/library";
export const dynamicParams = false;
export function generateStaticParams() {
  return library.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const a = library.find((x) => x.slug === slug);
  return {
    title: a?.title,
    description: a?.summary,
  };
}
export default async function ReadArticle({ params }: Props) {
  const { slug } = await params;
  const a = library.find((x) => x.slug === slug);
  if (!a) notFound();
  const others = related(a);
  const { chapter, lesson, previous, next } = readingPosition(slug);
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">{siteName}</Link> /{" "}
        <Link href="/articles/">Учебный маршрут</Link> /{" "}
        <Link href={{ pathname: "/articles/", query: { section: chapter.id } }}>
          {chapter.title}
        </Link>
      </nav>
      <article>
        <header>
          <small>
            {chapter.title} · Статья {lesson} из {chapter.lessons.length}
          </small>
          <h1>{a.title}</h1>
          <p>{a.summary}</p>
        </header>
        <div className="article-body md">
          <Markdown remarkPlugins={[remarkGfm]}>{a.body}</Markdown>
        </div>
        {a.ticket && (
          <Link href={"/#roadmap/" + a.ticket}>
            Проверить навык в Learning Roadmap
          </Link>
        )}
      </article>
      <nav aria-label="Порядок чтения" className="lesson-pager">
        {previous && (
          <Link href={"/articles/" + previous.slug + "/"}>
            <small>Предыдущая статья</small>
            {previous.title}
          </Link>
        )}
        {next ? (
          <Link href={"/articles/" + next.slug + "/"}>
            <small>Следующая статья</small>
            {next.title}
          </Link>
        ) : (
          <Link href="/articles/">
            <small>Последняя статья маршрута</small>Вернуться к разделам
          </Link>
        )}
      </nav>
      {others.length > 0 && (
        <section className="article-related">
          <h2>Связанные материалы</h2>
          <ul>
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={"/articles/" + other.slug + "/"}>
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <footer>
        <Link href="/articles/">К оглавлению статей</Link>
      </footer>
    </main>
  );
}
