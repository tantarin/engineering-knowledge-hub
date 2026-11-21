import { siteName } from "../../src/identity";
import Link from "next/link";
import { entries } from "../../src/articles/library";
import Catalog from "../../src/articles/Catalog";
export const metadata = {
  title: "Статьи для backend-интервью",
};
export default function Collection() {
  return (
    <main className="article-shell collection">
      <nav>
        <Link href="/">{siteName}</Link> / Статьи
      </nav>
      <header>
        <h1>Статьи для backend-интервью</h1>
        <p>
          {entries.length} материалов о многопоточности, базах данных,
          проектировании систем и поиске работы в международной команде.
        </p>
      </header>
      <Catalog entries={entries} />
    </main>
  );
}
