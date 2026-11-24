import { DeadlockLesson } from "../../../src/articles/DeadlockLesson";
import { siteName } from "../../../src/identity";
import Link from "next/link";
import { InterviewAnswer, LockScenarios } from "../../../src/articles/LockExamples";
import { notFound } from "next/navigation";
import { articles } from "../../../src/articles/concurrency";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
hljs.registerLanguage("java", java);
function JavaExample({ code }: { code: string }) {
  return <pre><code dangerouslySetInnerHTML={{
    __html: hljs.highlight(code, { language: "java" }).value,
  }} /></pre>;
}

export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const a = articles.find((v) => v.slug === slug);
  return {
    title: a?.title,
    description: a?.lead,
  };
}
export default async function Article({ params }: Props) {
  const { slug } = await params;
  const index = articles.findIndex((a) => a.slug === slug);
  if (index < 0) notFound();
  const a = articles[index],
    next = articles[index + 1];
  return (
    <main className="article-shell">
      <nav>
        <Link href="/">{siteName}</Link> /{" "}
        <Link href="/concurrency/">Многопоточность</Link>
      </nav>
      <article>
        <header>
          <small>{a.group} · Java 21</small>
          <h1>{a.title}</h1>
          <p>{a.lead}</p>
        </header>
        <div className="article-body">
          {slug === "deadlocks" ? <DeadlockLesson article={a} /> : <>
          {a.previousLesson && <Link href={"/concurrency/" + a.previousLesson.slug + "/"}>{a.previousLesson.title}</Link>}
          {a.introduction && <>
            <h2>{a.introduction.heading}</h2>
            <p>{a.introduction.before}</p>
            <JavaExample code={a.introduction.code} />
            <p>{a.introduction.after}</p>
              {a.introduction.illustration && <img src={`../../illustrations/${a.introduction.illustration.file}`} alt={a.introduction.illustration.alt} style={{ width: "100%", height: "auto" }} />}
            {a.introduction.followUp && <section>
              <h2>{a.introduction.followUp.heading}</h2>
              <p>{a.introduction.followUp.text}</p>
              <JavaExample code={a.introduction.followUp.code} />
              <p>{a.introduction.followUp.explanation}</p>
            </section>}
            <h2>{a.introduction.nextHeading}</h2>
          </>}
          {a.beforeExample && <section><h2>{a.beforeExample.heading}</h2><p>{a.beforeExample.text}</p></section>}
          <p>{a.scenario}</p>
          <JavaExample code={a.code} />
          <p>{a.analysis}</p>
          {a.walkthrough?.map(step => <section key={step.heading}>
            <h2>{step.heading}</h2><p>{step.text}</p>
            {step.code && <JavaExample code={step.code} />}
            {step.scenarios && <LockScenarios />}
              {step.illustration && <img src={`../../illustrations/${step.illustration.file}`} alt={step.illustration.alt} style={{ width: "100%", height: "auto" }} />}
          </section>)}
          {a.comparison && <section>
            <h2>Когда выбрать synchronized, а когда ReentrantLock?</h2>
            <p>Для последовательности setText() и print() достаточно synchronized. Требование «подождать максимум 50 мс» даёт конкретную причину выбрать ReentrantLock.</p>
            <div style={{ overflowX: "auto" }}><table>
              <thead><tr><th>Возможность</th><th>synchronized</th><th>ReentrantLock</th></tr></thead>
              <tbody>{a.comparison.map(row => <tr key={row.feature}><th scope="row">{row.feature}</th><td>{row.monitor}</td><td>{row.lock}</td></tr>)}</tbody>
            </table></div>
          </section>}
          {a.glossary && <section id="methods">
            <h2>Методы CompletableFuture на примерах</h2>
            <dl>{a.glossary.map(({ method, explanation }) => (
              <div key={method}>
                <dt><code>{method}</code></dt>
                <dd><p>{explanation}</p></dd>
              </div>
            ))}</dl>
          </section>}
          <section className="panel road-panel">
            <h2>Вопрос для самопроверки</h2>
            <p>{a.question}</p>
            <details>
              <summary>Сверить ответ</summary>
              <p>{a.answer}</p>
            </details>
            {a.extraQuestions?.map(q => <details key={q.question}>
              <summary>{q.question}</summary><p>{q.answer}</p>
            </details>)}
          </section>
          {a.englishAnswer && <InterviewAnswer question={a.englishQuestion} answer={a.englishAnswer} />}
          <p>
            <a href={a.source} rel="noreferrer" target="_blank">
              Первоисточник ·{" "}
              {a.source.includes("openjdk.org")
                ? "OpenJDK"
                : a.source.includes("jls")
                  ? "Java Language Specification"
                  : "Java 21 API"}
            </a>
          </p>
          {a.ticket && (
            <Link href={"/#roadmap/" + a.ticket}>
              Проверить навык в Learning Roadmap
            </Link>
          )}
          </>}
        </div>
      </article>
      <footer>
        <Link href="/concurrency/">Все статьи</Link>
        {next && (
          <Link href={"/concurrency/" + next.slug + "/"}>
            Далее · {next.title}
          </Link>
        )}
      </footer>
    </main>
  );
}
