"use client";
import { useState, useEffect } from "react";
import {
  Database,
  Workflow,
  Coffee,
  Zap,
  BookOpen,
  ArrowUpRight,
  CalendarDays,
  Layers,
  MessageSquare,
  Plus,
  Check,
  LibraryBig,
  ChevronRight,
  Target,
  FileText,
  Terminal,
  Clock3,
  ListChecks,
} from "lucide-react";
import {siteName,authorRole} from "./identity";
import Link from "next/link";
import Art from "./Art";
import MD from "./Markdown";
import { State, Note, Item, interviewCats, date, due } from "./types";
export const iconFor = (cat: string) =>
  ({ PostgreSQL: Database, Kafka: Workflow, "Java 21": Coffee, Redis: Zap })[
    cat
  ] || BookOpen;
export const tone = (cat: string) =>
  ({ PostgreSQL: "blue", Kafka: "purple", "Java 21": "amber", Redis: "rose" })[
    cat
  ] || "teal";
export function Badge({ cat }: { cat: string }) {
  const Icon = iconFor(cat);
  return (
    <span className={"cat-icon " + tone(cat)}>
      <Icon size={21} strokeWidth={1.65} />
    </span>
  );
}
export function Material({ n, open }: { n: Note; open: any }) {
  return (
    <button className="material" onClick={() => open(n)}>
      <div className="spread">
        <Badge cat={n.category} />
        <span className="status">{n.status}</span>
      </div>
      <small>{n.category}</small>
      <h3>{n.title}</h3>
      <div className="tags">
        {n.tags.slice(0, 2).map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </button>
  );
}
export function Dashboard({
  s,
  navigate,
  open,
  create,
  editItem,
  run,
}: {
  s: State;
  navigate: any;
  open: any;
  create: any;
  editItem: any;
  run: any;
}) {
  const cards = s.items.filter(due),
    qs = s.items.filter((i) => i.kind === "question"),
    tasks = s.items.filter((i) => i.kind === "task" && !i.details.done),
    active = s.notes.filter((n) =>
      ["Learning", "Practicing"].includes(n.status),
    ),
    focus =
      active[0] ||
      s.notes.find(
        (n) => n.origin?.startsWith("Карьера") && n.title === "MVCC",
      ) ||
      s.notes.find((n) => n.category === "PostgreSQL") ||
      s.notes[0],
    assessed = qs.filter((q) => q.details.score),
    total = qs.length;
  const last = new Map<string, string>();
  for (const r of s.reviews) {
    const note = s.items.find((i) => i.id === r.card)?.note;
    if (note && !last.has(note)) last.set(note, r.created);
  }
  const stale = s.notes.filter(
    (n) =>
      last.has(n.id) &&
      Date.now() - Date.parse(last.get(n.id)!) > 14 * 86400000,
  );
  return (
    <>
      <div className="page-head">
        <div className="eyeline">
          <span className="live-dot" /> {authorRole.toLocaleUpperCase("ru")}
        </div>
        <div className="spread">
          <h1>{siteName}</h1>
          <button className="primary" onClick={create}>
            <Plus size={17} /> Новый материал
          </button>
        </div>
        <p>Статьи о бэкенд-разработке, практические задачи и подготовка к интервью.</p>
        <div className="route-entry actions"><Link className="btn primary" href="/articles/">Открыть учебный маршрут</Link></div>
      </div>
      <div className="dash-top">
        <section className="focus">
          <Art />
          <div className="focus-copy">
            <span className="focus-label">
              <Target size={14} /> Фокус дня
            </span>
            <h2>Что изучить сегодня?</h2>
            <p>
              {cards.length
                ? "Вернитесь к карточкам, для которых наступил срок повторения."
                : focus
                  ? "Разберите тему «" +
                    focus.title +
                    "» и проверьте себя на практике."
                  : "Начните с инженерного вопроса, который хотите разобрать."}
            </p>
            <button
              onClick={() =>
                cards.length
                  ? navigate("review")
                  : focus
                    ? open(focus)
                    : create()
              }
            >
              {cards.length
                ? "К повторению"
                : focus
                  ? "Открыть тему"
                  : "Создать материал"}
              <BookOpen size={15} />
            </button>
          </div>
        </section>
        <section className="panel today">
          <div className="section-head">
            <h2>На сегодня</h2>
            <CalendarDays size={18} />
          </div>
          {[
            [Layers, "Повторить карточки", cards.length, "review", "purple"],
            [ListChecks, "Открытые задачи", tasks.length, "tasks", "teal"],
            [
              MessageSquare,
              "Сложные вопросы",
              qs.filter(
                (q) => q.details.gap || q.details.score?.some((x) => x === 0),
              ).length,
              "interview",
              "amber",
            ],
          ].map(([Icon, label, val, page, c]: any) => (
            <button
              className="today-row"
              key={page}
              onClick={() => navigate(page)}
            >
              <span className={"mini-icon " + c}>
                <Icon size={16} />
              </span>
              {label}
              <b>{val}</b>
            </button>
          ))}
        </section>
      </div>
      <div className="section-head main-section">
        <h2>
          <LibraryBig size={20} /> Библиотека материалов
        </h2>
        <button className="text-btn" onClick={() => navigate("library")}>
          Все материалы <ChevronRight size={15} />
        </button>
      </div>
      <div className="materials">
        {(s.notes.length ? s.notes.slice(0, 4) : []).map((n) => (
          <Material key={n.id} n={n} open={open} />
        ))}
        {!s.notes.length && (
          <button onClick={create}>Создать первый материал</button>
        )}
      </div>
      <div className="lower">
        <section className="panel">
          <div className="section-head">
            <h2>
              <Terminal size={18} /> В работе
            </h2>
            <button
              aria-label="Добавить задачу"
              onClick={() => editItem("task")}
            >
              <Plus size={16} />
            </button>
          </div>
          {active.map((n) => (
            <button className="row" key={n.id} onClick={() => open(n)}>
              {n.title}
              <small>{n.status}</small>
            </button>
          ))}
          {tasks.map((i) => (
            <button
              className="row"
              key={i.id}
              onClick={() =>
                run("item", { ...i, details: { ...i.details, done: true } })
              }
            >
              <span className="checkbox" />
              {i.title}
            </button>
          ))}
          {!active.length && !tasks.length && (
            <p className="muted">
              Здесь появятся задачи и темы со статусом Learning или Practicing.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>
              <MessageSquare size={18} /> Подготовка к интервью
            </h2>
            <button
              aria-label="Открыть интервью"
              onClick={() => navigate("interview")}
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="progress-title">
            <b>
              {assessed.length} <small>/ {total}</small>
            </b>
            <span>вопросов оценено</span>
          </div>
          <progress max={total || 1} value={assessed.length} />
        </section>
      </div>
      {stale.length > 0 && (
        <section className="panel">
          <h2>
            <Clock3 size={18} /> Давно не повторяли
          </h2>
          {stale.map((n) => (
            <button className="row" key={n.id} onClick={() => open(n)}>
              {n.title}
              <small>{date(last.get(n.id)!)}</small>
            </button>
          ))}
        </section>
      )}
    </>
  );
}
export function Review({ items, run }: { items: Item[]; run: any }) {
  const queue = items
      .filter(due)
      .sort((a, b) =>
        a.details.schedule.due.localeCompare(b.details.schedule.due),
      ),
    card = queue[0],
    [shown, S] = useState("");
  if (!card)
    return <p className="empty">На текущий момент очередь повторения пуста.</p>;
  return (
    <div className="panel exercise">
      <small>К повторению · {queue.length}</small>
      <h2>{card.title}</h2>
      {shown === card.id ? (
        <>
          <MD text={card.details.answer} />
          <div className="actions">
            {["Again", "Hard", "Good", "Easy"].map((x, j) => (
              <button
                key={x}
                onClick={() => run("review", { id: card.id, rating: j + 1 })}
              >
                {x}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button className="primary" onClick={() => S(card.id)}>
          Показать ответ
        </button>
      )}
    </div>
  );
}
export function Interview({ items, run }: { items: Item[]; run: any }) {
  const [cat, C] = useState("Все темы"),
    [only, O] = useState(false),
    [ids, I] = useState<string[]>([]),
    [on, A] = useState(false),
    [shown, S] = useState(false),
    [score, P] = useState([0, 0, 0]),
    [gap, G] = useState("");
  const questions = items.filter(
      (i) =>
        i.kind === "question" &&
        (cat === "Все темы" || cat === (i.details.category || "Coding")) &&
        (!only || i.details.gap || i.details.score?.some((x) => x === 0)),
    ),
    q = items.find((x) => x.id === ids[0]);
  function next() {
    I(ids.slice(1));
    S(false);
    G("");
    P([0, 0, 0]);
  }
  return (
    <section className="panel">
      <h2>Тренировка интервью</h2>
      {on ? (
        q ? (
          <>
            <small>
              {q.details.category || "Coding"} · осталось {ids.length}
            </small>
            <h3>{q.title}</h3>
            {!shown ? (
              <button onClick={() => S(true)}>Сверить ответ</button>
            ) : (
              <>
                <MD
                  text={[q.details.answer, q.details.english]
                    .filter(Boolean)
                    .join("\n\n")}
                />
                <div className="fields">
                  {["Точность", "Полнота", "Ясность"].map((c, j) => (
                    <label key={c}>
                      {c}
                      <select
                        value={score[j]}
                        onChange={(e) =>
                          P(
                            score.map((s, k) =>
                              k === j ? +e.target.value : s,
                            ),
                          )
                        }
                      >
                        <option value={0}>Есть пробел</option>
                        <option value={1}>Частично</option>
                        <option value={2}>Уверенно</option>
                      </select>
                    </label>
                  ))}
                </div>
                <label>
                  Что повторить
                  <input value={gap} onChange={(e) => G(e.target.value)} />
                </label>
                <button
                  className="primary"
                  onClick={async () => {
                    if (
                      await run("item", {
                        ...q,
                        details: { ...q.details, score, gap },
                      })
                    )
                      next();
                  }}
                >
                  Сохранить оценку
                </button>
              </>
            )}
          </>
        ) : (
          <p>
            Тренировка завершена.{" "}
            <button onClick={() => A(false)}>Выбрать тему</button>
          </p>
        )
      ) : (
        <div className="actions">
          <select
            aria-label="Тема тренировки"
            value={cat}
            onChange={(e) => C(e.target.value)}
          >
            {["Все темы", ...interviewCats].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <label className="inline">
            <input
              type="checkbox"
              checked={only}
              onChange={(e) => O(e.target.checked)}
            />{" "}
            Только сложные
          </label>
          <button
            disabled={!questions.length}
            onClick={() => {
              I(questions.map((i) => i.id));
              A(true);
            }}
          >
            Начать · {questions.length}
          </button>
        </div>
      )}
    </section>
  );
}
