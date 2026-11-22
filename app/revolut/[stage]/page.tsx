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
  const sections: {
    title: string;
    lessons: { slug: string; task: string }[];
  }[] = [];
  for (const lesson of stage.lessons) {
    const title = "section" in lesson ? String(lesson.section) : "";
    if (!sections.length || sections[sections.length - 1].title !== title)
      sections.push({ title, lessons: [] });
    sections[sections.length - 1].lessons.push(lesson);
  }
  const position = stages.indexOf(stage);
  const previous = stages[position - 1],
    next = stages[position + 1];
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">{siteName}</Link> /{" "}
        <Link href="/articles/">Учебный маршрут</Link> / Revolut
      </nav>
      <header>
        <small>{stage.label} · Revolut</small>
        <h1>{stage.title}</h1>
        {stage.duration && <strong>{stage.duration}</strong>}
        <p>{stage.goal}</p>
      </header>
      <section>
        <h2>Как проходит этап</h2>
        <p>{stage.format}</p>
        <small>
          Формат и длительность приведены по личному опыту интервью.{" "}
          <a href="https://www.revolut.com/blog/post/how-to-ace-your-java-interview-at-revolut/">
            Официальный гид Revolut для Java Engineer
          </a>
        </small>
        {stage.blocks?.map((block) => (
          <div key={block.title}>
            <h3>{block.title}</h3>
            <p>{block.text}</p>
          </div>
        ))}
      </section>
      <section>
        <h2>Порядок подготовки</h2>
        {sections.length > 1 && (
          <nav aria-label="Темы технического интервью" className="stage-topics">
            {sections.map((group) => (
              <a href={"#topic-" + group.lessons[0].slug} key={group.title}>
                {group.title}
              </a>
            ))}
          </nav>
        )}
        {sections.map((section) => (
          <div key={section.title} id={"topic-" + section.lessons[0].slug}>
            {section.title && <h3>{section.title}</h3>}
            <ol className="stage-lessons">
              {section.lessons.map((l) => {
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
          </div>
        ))}
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
        {previous && (
          <Link href={"/revolut/" + previous.id + "/"}>
            Назад · {previous.title}
          </Link>
        )}
        {next && (
          <Link href={"/revolut/" + next.id + "/"}>Далее · {next.title}</Link>
        )}
      </footer>
    </main>
  );
}
