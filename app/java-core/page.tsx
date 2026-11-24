import Link from "next/link";
import route from "../../src/articles/java-core-route.json";
import CorePriority from "../../src/articles/CorePriority";

export const metadata = { title: "Java Core для backend-собеседования" };
const titles: Record<string, string> = route.titles;

export default function JavaCore() {
  return <main className="article-shell">
    <nav><Link href="/articles/">Учебный маршрут</Link> / Java Core</nav>
    <header><h1>Java Core для backend-собеседования</h1>
      <p>Почему карта теряет ключ, пул потоков переносит данные между запросами, а сборщик мусора оставляет ненужный объект в памяти? Разберите эти случаи на Java 21, запустите примеры и попробуйте объяснить результат на английском.</p></header>
    <div className="article-body md">
      <h2>Первые 12 тем</h2>
      <CorePriority lessons={route.priority.map(slug => ({slug, title: titles[slug]}))}/>
      <h2>Карта тем</h2>
      {route.sections.map(section => <details key={section.id} id={section.id}>
        <summary>{section.title} · {section.lessons.length}</summary>
        <ol>{section.lessons.map(slug => <li key={slug}><Link href={`/articles/${slug}/`}>{titles[slug]}</Link></li>)}</ol>
      </details>)}
      <h2>Для повторения многопоточности</h2>
      <p><Link href="/concurrency/happens-before/">Happens-before и volatile</Link> · <Link href="/concurrency/synchronized-monitor/">Монитор и synchronized</Link> · <Link href="/concurrency/reentrant-lock/">ReentrantLock</Link> · <Link href="/concurrency/deadlocks/">Deadlock</Link></p>
    </div>
  </main>;
}
