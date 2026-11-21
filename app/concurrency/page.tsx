import { siteName } from "../../src/identity";
import {library} from "../../src/articles/library";
import Link from "next/link";
import { articles } from "../../src/articles/concurrency";
export const metadata = {
  title: "Многопоточность Java",
};
export default function Contents() {
  const forkJoin = library.find(a=>a.slug==="fork-join-pool")!;
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">{siteName}</Link> / Java
      </nav>
      <header>
        <h1>Многопоточность в Java</h1>
        <p>
          От первого потерянного обновления до отмены задачи. Каждая статья
          разбирает конкретную ситуацию и заканчивается вопросом для интервью.
        </p>
      </header>
      {[...new Set(articles.map((a) => a.group))].map((group) => (
        <section key={group}>
          <h2>{group}</h2>
          <div className="article-list">
            {articles
              .filter((a) => a.group === group)
              .map((a) => (
                <Link href={"/concurrency/" + a.slug + "/"} key={a.slug}>
                  <h3>{a.title}</h3>
                  <p>{a.lead}</p>
                </Link>
              ))}
            {group === "Выполнение задач" && <Link href={"/articles/"+forkJoin.slug+"/"}><h3>{forkJoin.title}</h3><p>{forkJoin.summary}</p></Link>}
          </div>
        </section>
      ))}
    </main>
  );
}
