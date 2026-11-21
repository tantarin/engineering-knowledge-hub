import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { library, related } from "../../../src/articles/library";
export const dynamicParams = false;
export function generateStaticParams() {
  return library.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const a = library.find((x) => x.slug === slug);
  return {
    title: a?.title + " · Engineering Knowledge Hub",
    description: a?.summary,
  };
}
export default async function ReadArticle({ params }: Props) {
  const { slug } = await params;
  const a = library.find((x) => x.slug === slug);
  if (!a) notFound();
  const others = related(a);
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">Engineering Knowledge Hub</Link> /{" "}
        <Link href="/articles/">Все статьи</Link>
      </nav>
      <article>
        <header>
          <small>{a.group}</small>
          <h1>{a.title}</h1>
          <p>{a.summary}</p>
        </header>
        <div className="article-body md">
          <Markdown remarkPlugins={[remarkGfm]}>{a.body}</Markdown>
        </div>
      </article>
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
