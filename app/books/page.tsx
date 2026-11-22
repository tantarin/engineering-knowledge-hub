import Link from "next/link";
import { siteName } from "../../src/identity";

export const metadata = { title: "Книги" };

const pdf = "https://ftp.zhirov.kz/books/IT/Алгоритмы/Высоконагруженные%20приложения.%20Программирование%2C%20масштабирование%2C%20поддержка%20%28Мартин%20Клеппман%29.pdf";

export default function Books() {
  return (
    <main className="article-shell">
      <nav aria-label="Хлебные крошки"><Link href="/">{siteName}</Link> / Книги</nav>
      <header><h1>Книги</h1></header>
      <article>
        <p className="eyeline">Мартин Клеппман</p>
        <h2>Высоконагруженные приложения. Программирование, масштабирование, поддержка</h2>
        <p>Почему после успешной записи реплика иногда возвращает старое значение? Что происходит с транзакциями при конкурентном доступе? Книга разбирает эти вопросы через устройство хранилищ, репликацию и модели согласованности.</p>
        <p><a className="btn primary" href={pdf}>Открыть PDF</a></p>
        <h3>Статьи по теме</h3>
        <ul>
          <li><Link href="/articles/replica-read-your-writes/">Чтение с реплики после записи</Link></li>
          <li><Link href="/articles/partitioning-and-sharding/">Партиционирование и шардирование</Link></li>
        </ul>
      </article>
    </main>
  );
}
