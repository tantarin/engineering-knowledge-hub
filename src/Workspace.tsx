"use client";
import { useState } from "react";
import {
  Pencil,
  Plus,
  ArrowLeft,
  Link2,
  BookOpen,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Note, State, statuses } from "./types";
import MD from "./Markdown";
import { Badge } from "./Views";
const tabs = [
  "Understand",
  "Practice",
  "Explain",
  "Recall",
  "Connections",
  "Sources",
  "Publish",
];
function wiki(text: string, n: Note, s: State) {
  return text.replace(/\[\[([^\]\n]+)\]\]/g, (original, inner) => {
    const [target, alias] = inner.split("|"),
      name = target.split("#")[0].replace(/\.md$/, "");
    const edges = s.links.filter((l) => l.source === n.id).map((l) => l.target),
      found = s.notes.find(
        (v) =>
          edges.includes(v.id) &&
          (v.origin?.replace(/\.md$/, "").endsWith("/" + name) ||
            v.title === name),
      );
    return found
      ? "[" + (alias || name) + "](#note/" + found.id + ")"
      : original;
  });
}
export default function Workspace({
  n,
  s,
  open,
  edit,
  make,
  run,
  back,
  link,
}: {
  n: Note;
  s: State;
  open: any;
  edit: any;
  make: any;
  run: any;
  back: any;
  link: any;
}) {
  const [tab, T] = useState(tabs[0]),
    [practice, P] = useState(n.practice),
    [explain, E] = useState(n.explanation),
    [hint, H] = useState(false);
  const edges = s.links.filter((l) => l.source === n.id || l.target === n.id),
    items = s.items.filter((i) => i.note === n.id),
    create = (kind: string) => make(kind, n);
  return (
    <>
      <button className="text-btn" onClick={back}>
        <ArrowLeft size={15} /> База знаний
      </button>
      <header className="page-head">
        <div className="actions">
          <Badge cat={n.category} />
          <small>{n.category}</small>
          <span className="status">{n.status}</span>
        </div>
        <div className="spread">
          <h1>{n.title}</h1>
          <button onClick={() => edit(n)}>
            <Pencil size={15} /> Изменить
          </button>
        </div>
        <p>{n.origin || "Личный материал"}</p>
      </header>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => {
              T(t);
              H(false);
            }}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="panel reading">
        {tab === "Understand" && (
          <>
            <MD text={wiki(n.body, n, s)} />
            <div className="actions">
              <label className="inline">
                Статус{" "}
                <select
                  value={n.status}
                  onChange={(e) =>
                    run("note", { ...n, status: e.target.value })
                  }
                >
                  {statuses.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <small>Понимание · {n.level}/5</small>
            </div>
          </>
        )}
        {tab === "Practice" && (
          <>
            <h2>Практика и наблюдения</h2>
            <label>
              Запишите гипотезу, пример и результат
              <textarea
                rows={9}
                value={practice}
                onChange={(e) => P(e.target.value)}
              />
            </label>
            <div className="actions">
              <button
                className="primary"
                onClick={() => run("note", { ...n, practice })}
              >
                Сохранить практику
              </button>
              <button onClick={() => create("lab")}>Создать эксперимент</button>
            </div>
          </>
        )}
        {tab === "Explain" && (
          <>
            <h2>Объясните своими словами</h2>
            <label>
              Как работает механизм и когда он полезен?
              <textarea
                rows={9}
                value={explain}
                onChange={(e) => E(e.target.value)}
              />
            </label>
            <div className="actions">
              <button
                className="primary"
                onClick={() => run("note", { ...n, explanation: explain })}
              >
                Сохранить объяснение
              </button>
              <button onClick={() => create("english")}>
                Практика на английском
              </button>
            </div>
          </>
        )}
        {tab === "Recall" && (
          <>
            <small>Самопроверка</small>
            <h2>
              {n.prompt || "Объясните «" + n.title + "» на конкретном примере."}
            </h2>
            <button onClick={() => H(!hint)}>
              {hint ? "Скрыть материал" : "Сверить с материалом"}
            </button>
            {hint && <MD text={n.body} />}
            <div className="actions">
              <button onClick={() => create("card")}>
                <Plus size={16} /> Черновик карточки
              </button>
              <button onClick={() => create("question")}>
                Вопрос интервью
              </button>
            </div>
          </>
        )}
        {tab === "Connections" && (
          <>
            <div className="section-head">
              <h2>Связи материала</h2>
              <button onClick={() => link(n.id)}>
                <Link2 size={15} /> Связать
              </button>
            </div>
            {edges.map((l) => {
              const out = l.source === n.id,
                other = s.notes.find(
                  (x) => x.id === (out ? l.target : l.source),
                );
              return (
                <div className="row" key={l.id}>
                  <button className="text-btn" onClick={() => open(other)}>
                    {other?.title}
                  </button>
                  <small>
                    {out ? "Исходящая" : "Входящая"} · {l.label}
                  </small>
                  <button
                    aria-label="Удалить связь"
                    onClick={() =>
                      confirm("Удалить эту связь?") &&
                      run("delete", { table: "links", id: l.id })
                    }
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {!edges.length && <p>Добавьте связь и поясните её смысл.</p>}
          </>
        )}
        {tab === "Sources" && (
          <>
            <h2>Источники</h2>
            {n.sources.length ? (
              n.sources.map((src) => (
                <p key={src}>
                  <a href={src} target="_blank" rel="noreferrer">
                    {src} <ExternalLink size={14} />
                  </a>
                </p>
              ))
            ) : (
              <p>
                Отдельный список источников пока пуст. Ссылки в тексте доступны
                во вкладке Understand.
              </p>
            )}
            <button onClick={() => edit(n)}>Редактировать источники</button>
          </>
        )}
        {tab === "Publish" && (
          <>
            <h2>Подготовить публикацию</h2>
            <p>Начните черновик с собственного объяснения темы.</p>
            <button className="primary" onClick={() => create("post")}>
              Создать черновик
            </button>
          </>
        )}
        {items.length > 0 && (
          <div className="linked">
            <h3>Привязанные записи</h3>
            {items.map((i) => (
              <button
                key={i.id}
                className="row"
                onClick={() => make(i.kind, n, i)}
              >
                {i.title}
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
