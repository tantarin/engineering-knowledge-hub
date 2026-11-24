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
        <p><Link href="/java-core/">Java Core · карта тем и первые 12 статей</Link></p>
      </header>
      <Catalog chapters={chapters.filter(chapter => chapter.id !== "interview")} />
    </main>
  );
}
