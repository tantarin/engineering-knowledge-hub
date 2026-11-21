import { siteName } from "../../src/identity";
import Link from "next/link";
import { chapters } from "../../src/articles/library";
import Catalog from "../../src/articles/Catalog";
export const metadata = { title: "Учебный маршрут по бэкенд-разработке" };
export default function Collection() {
  const first = chapters[0].lessons[0];
  return (
    <main className="article-shell collection">
      <nav>
        <Link href="/">{siteName}</Link> / Учебный маршрут
      </nav>
      <header>
        <h1>Учебный маршрут по бэкенду</h1>
        <p>
          Проходите разделы по порядку или начните с нужной технологии. В конце
          каждой статьи есть переход к следующей.
        </p>
        <Link className="btn primary" href={"/articles/" + first.slug + "/"}>
          Начать с темы «{first.title}»
        </Link>
      </header>
      <aside className="recruiter-note">
        <h2>Первый этап в Revolut</h2>
        <p>
          В руководстве для Java Engineer первым указан разговор с рекрутером об
          опыте, карьерных целях и интересе к команде. Первая техническая
          встреча — live coding на Java.
        </p>
        <div className="actions">
          <Link href="/articles/recruiter-screen-preparation/">
            Подготовиться к первому звонку
          </Link>
          <a href="https://www.revolut.com/blog/post/how-to-ace-your-java-interview-at-revolut/">
            Руководство Revolut · 31 марта 2025
          </a>
        </div>
      </aside>
      <Catalog chapters={chapters} />
    </main>
  );
}
