import { ImportCancellationQuiz, Question } from "../../../src/articles/ImportCancellationQuiz";
import { InterviewAnswer } from "../../../src/articles/LockExamples";
import { siteName } from "../../../src/identity";
import { Suspense } from "react";
import StagePager from "../../../src/articles/StagePager";
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
  const usualPager = (
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
  );
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
          {a.sqlExercise && <>
            <details><summary>Подсказка</summary><p>{a.sqlExercise.hint}</p></details>
            <details><summary>Показать решение</summary>
              <pre><code>{a.sqlExercise.solution}</code></pre>
              <p>{a.sqlExercise.explanation}</p>
            </details>
          </>}
          {slug === "import-cancel-after-commit" && <ImportCancellationQuiz />}
          {slug === "thread-lifecycle" && <section><h2>Проверь понимание</h2>
            <Question item={{
              prompt: "100 потоков RUNNABLE, CPU — 5%, задержка HTTP выросла. Что проверить в первую очередь?",
              options: ["Добавить CPU", "Снять дампы, сравнить CPU time и проверить профиль потоков", "Увеличить пул в десять раз"],
              correct: 1,
              reason: "Число RUNNABLE не указывает причину задержки. Стеки, прирост CPU time и метрики за один интервал помогут отличить вычисления от ожидания."
            }} />
          </section>}
          {a.quiz && <section><h2>Проверь понимание</h2>
            {a.quiz.map(item => <Question key={item.prompt} item={item} />)}
          </section>}
          {a.exercise && <section>
            <h2>Найдите ошибку</h2>
            <pre><code>{a.exercise.code}</code></pre>
            <p>{a.exercise.prompt}</p>
            <details><summary>Сверить решение</summary><p>{a.exercise.solution}</p></details>
            <p><Link href="/java-core/">Вернуться к карте Java Core</Link></p>
          </section>}
          {a.interview && <InterviewAnswer {...a.interview} />}
        </div>
        {a.ticket && (
          <Link href={"/#roadmap/" + a.ticket}>
            Проверить навык в Learning Roadmap
          </Link>
        )}
      </article>
      <Suspense fallback={usualPager}>
        <StagePager slug={slug}>{usualPager}</StagePager>
      </Suspense>
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
