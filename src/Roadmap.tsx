"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Plus,
  Search,
  ArrowLeft,
  EyeOff,
  Link2,
  ChevronRight,
} from "lucide-react";
import { api, blank, date } from "./types";
import { mastery, flags } from "./contracts.mjs";
import { Modal } from "./Forms";
import MD from "./Markdown";
const labels = [
  "Не изучала",
  "Изучаю",
  "Изучила теорию",
  "Объясняю без подсказки",
  "Применяю на практике",
  "Объясняю на английском",
];
const distinct = (a: string[]) => [...new Set(a)].sort();
const group = (list: any[], k: string) =>
  distinct(list.map((t) => t[k])).map(
    (name) => [name, list.filter((t) => t[k] === name)] as const,
  );
function TopicForm({ initial, save }: { initial: any; save: any }) {
  const [v, V] = useState(
      initial || {
        area: "",
        section: "",
        subsection: "",
        title: "",
        difficulty: "Middle",
        theory: "",
        question: "",
        answer: "",
        criteria: [],
        sources: [],
        skills: [],
      },
    ),
    [skills, S] = useState(v.skills),
    [err, E] = useState("");
  const prop = (k: string, val: any) => V({ ...v, [k]: val });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save({ ...v, skills });
        } catch (e) {
          E(e.message);
        }
      }}
    >
      {[
        ["area", "Направление"],
        ["section", "Раздел"],
        ["subsection", "Подраздел"],
        ["title", "Конкретная тема"],
      ].map(([k, l]) => (
        <label key={k}>
          {l}
          <input
            required
            value={v[k]}
            onChange={(e) => prop(k, e.target.value)}
          />
        </label>
      ))}
      <label>
        Сложность
        <select
          value={v.difficulty}
          onChange={(e) => prop("difficulty", e.target.value)}
        >
          <option>Middle</option>
          <option>Senior</option>
        </select>
      </label>
      {[
        ["theory", "Теория · Markdown"],
        ["question", "Экзаменационный вопрос"],
        ["answer", "Эталонное объяснение"],
      ].map(([k, l]) => (
        <label key={k}>
          {l}
          <textarea
            required
            rows={4}
            value={v[k]}
            onChange={(e) => prop(k, e.target.value)}
          />
        </label>
      ))}
      <h3>Проверяемые навыки</h3>
      {skills.map((sk, i) => (
        <label key={sk.id}>
          Навык {i + 1}
          <input
            value={sk.text}
            required
            onChange={(e) =>
              S(
                skills.map((s, j) =>
                  i === j ? { ...s, text: e.target.value } : s,
                ),
              )
            }
          />
        </label>
      ))}
      <button
        type="button"
        onClick={() => S([...skills, { id: crypto.randomUUID(), text: "" }])}
      >
        Добавить навык
      </button>
      {[
        ["criteria", "Критерии · каждый с новой строки"],
        ["sources", "Источник · URL с новой строки"],
      ].map(([k, l]) => (
        <label key={k}>
          {l}
          <textarea
            value={v[k].join("\n")}
            onChange={(e) => prop(k, e.target.value.split("\n"))}
          />
        </label>
      ))}
      <p role="alert">{err}</p>
      <footer>
        <button className="primary" disabled={!skills.length}>
          Сохранить тему
        </button>
      </footer>
    </form>
  );
}
function Exam({
  topics,
  save,
  close,
}: {
  topics: any[];
  save: any;
  close: any;
}) {
  const [idx, I] = useState(0),
    [response, R] = useState(""),
    [reveal, H] = useState(false),
    [weak, W] = useState<any[]>([]),
    [busy, B] = useState(false),
    [err, E] = useState("");
  const t = topics[idx];
  return (
    <Modal wide title="Проверить знания" close={close}>
      {t ? (
        <>
          <small>
            {idx + 1} / {topics.length} · {t.title}
          </small>
          <h3>{t.question}</h3>
          <label>
            Ваш ответ
            <textarea
              autoFocus
              rows={5}
              value={response}
              readOnly={reveal}
              onChange={(e) => R(e.target.value)}
            />
          </label>
          {!reveal ? (
            <button
              className="primary"
              disabled={!response.trim()}
              onClick={() => H(true)}
            >
              Сверить с эталоном
            </button>
          ) : (
            <>
              <MD text={t.answer} />
              <h3>Критерии</h3>
              <ul>
                {t.criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="actions">
                {[
                  ["correct", "Правильно"],
                  ["partial", "Частично"],
                  ["miss", "Не смогла ответить"],
                ].map(([result, l]) => (
                  <button
                    disabled={busy}
                    key={result}
                    onClick={async () => {
                      B(true);
                      try {
                        await save("exam", { topic: t.id, response, result });
                        if (result !== "correct") W([...weak, t]);
                        I(idx + 1);
                        H(false);
                        R("");
                      } catch (e) {
                        E(e.message);
                      } finally {
                        B(false);
                      }
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
          <p role="alert">{err}</p>
        </>
      ) : (
        <>
          <h3>Проверено тем · {topics.length}</h3>
          <p>
            {weak.length
              ? "Вернитесь к темам ниже для повторения."
              : "Все ответы оценены как правильные."}
          </p>
          {weak.map((t) => (
            <p key={t.id}>
              <a href={"#roadmap/" + t.id} onClick={close}>
                {t.title}
              </a>
            </p>
          ))}
          <button onClick={close}>Завершить</button>
        </>
      )}
    </Modal>
  );
}
export default function Roadmap({
  route,
  navigate,
  s,
  newNote,
}: {
  route: string;
  navigate: any;
  s: any;
  newNote: any;
}) {
  const [data, D] = useState<any>(),
    [err, E] = useState(""),
    [area, A] = useState("Все"),
    [difficulty, F] = useState("Все"),
    [q, Q] = useState(""),
    [hidden, H] = useState(false),
    [repeatOnly, O] = useState(false),
    [exam, X] = useState<any[]>(),
    [edit, V] = useState<any>(),
    [attach, S] = useState("");
  const key = route.split("/")[1];
  async function refresh() {
    D(await api("/roadmap"));
  }
  async function save(op, p) {
    await api("/" + op, p);
    await refresh();
  }
  async function act(op, p) {
    try {
      await save(op, p);
    } catch (e) {
      E(e.message);
    }
  }
  useEffect(() => {
    refresh().catch((e) => E(e.message));
  }, [route]);
  if (!data) return <p>{err || "Загрузка программы…"}</p>;
  const { topics, marks, exams, events, topicNotes, contexts } = data,
    t = topics.find((x) => x.id === key),
    stats = mastery(topics, marks),
    latest = new Map();
  for (const ex of exams) if (!latest.has(ex.topic)) latest.set(ex.topic, ex);
  const weak = (t: any) =>
    marks.some((m) => m.topic === t.id && m.repeat) ||
    (latest.has(t.id) && latest.get(t.id).result !== "correct");
  const list = topics.filter(
    (t) =>
      (hidden || !t.hidden) &&
      (area === "Все" || t.area === area) &&
      (difficulty === "Все" || difficulty === t.difficulty) &&
      (!repeatOnly || weak(t)) &&
      [
        t.area,
        t.section,
        t.subsection,
        t.title,
        t.theory,
        t.question,
        ...t.skills.map((k) => k.text),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const historyByDay = new Map<string, any>();
  for (const e of events) historyByDay.set(e.created.slice(0, 10), e);
  const weakSections = group(
    topics.filter((t) => !t.hidden),
    "area",
  )
    .flatMap(([a, ts]) =>
      group(ts, "section").map(([section, ts]) => ({
        name: a + " / " + section,
        ...mastery(ts, marks),
      })),
    )
    .sort((a, b) => a.percent - b.percent);
  const dialogs = (
    <>
      {exam && <Exam topics={exam} save={save} close={() => X(undefined)} />}{" "}
      {edit && (
        <Modal
          wide
          title={edit.id ? "Редактировать тему" : "Новая тема программы"}
          close={() => V(undefined)}
        >
          <TopicForm
            initial={edit.id ? edit : null}
            save={async (v) => {
              const r = await api("/topic", {
                ...v,
                criteria: v.criteria.filter(Boolean),
                sources: v.sources.filter(Boolean),
              });
              V(undefined);
              await refresh();
              navigate("roadmap/" + r.id);
            }}
          />
        </Modal>
      )}
      {err && <p role="alert">{err}</p>}
    </>
  );
  if (key && !t)
    return (
      <button onClick={() => navigate("roadmap")}>
        Тема отсутствует · вернуться к программе
      </button>
    );
  if (t) {
    const linked = topicNotes.filter((l) => l.topic === key);
    return (
      <>
        <button className="text-btn" onClick={() => navigate("roadmap")}>
          <ArrowLeft size={15} /> Программа подготовки
        </button>
        <header className="page-head">
          <small>{[t.area, t.section, t.subsection].join(" / ")}</small>
          <h1>{t.title}</h1>
          <p>
            {t.difficulty} · {t.skills.length} проверяемых навыков
          </p>
        </header>
        <div className="actions">
          <button className="primary" onClick={() => X([t])}>
            <ClipboardCheck size={16} /> Проверить знания
          </button>
          <button onClick={() => V(t)}>Изменить тему</button>
          <button onClick={() => act("hide", { id: t.id, hidden: !t.hidden })}>
            <EyeOff size={15} />
            {t.hidden ? "Показать в программе" : "Скрыть тему"}
          </button>
        </div>
        <section className="panel road-panel">
          <h2>Разбор темы</h2>
          <MD text={t.theory} />
          {t.sources.map((url) => (
            <a
              className="source"
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {new URL(url).hostname} <ChevronRight size={12} />
            </a>
          ))}
        </section>
        <section className="panel road-panel">
          <h2>Что я умею</h2>
          {t.skills.map((sk) => {
            const m = marks.find((m) => m.topic === t.id && m.skill === sk.id),
              checked = m?.flags || ["unstarted"];
            const toggle = (field, value) =>
              act("mark", { topic: t.id, skill: sk.id, field, value });
            return (
              <div className="skill" key={sk.id}>
                <h3>{sk.text}</h3>
                <div className="skillflags">
                  {flags.map((f, i) => (
                    <label key={f}>
                      <input
                        type="checkbox"
                        checked={checked.includes(f)}
                        onChange={(e) => toggle(f, e.target.checked)}
                      />
                      {labels[i]}
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <small>
                    {m?.checked
                      ? "Проверено " + date(m.checked)
                      : "Ещё не проверено"}
                  </small>
                  <button onClick={() => toggle("checked", true)}>
                    Проверено сегодня
                  </button>
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={!!m?.repeat}
                      onChange={(e) => toggle("repeat", e.target.checked)}
                    />{" "}
                    Нужно повторить
                  </label>
                </div>
              </div>
            );
          })}
        </section>
        <section className="panel road-panel">
          <h2>Заметки и практические примеры</h2>
          {linked.map((l) => (
            <button
              className="row"
              key={l.id}
              onClick={() => navigate("note/" + l.note)}
            >
              {s.notes.find((n) => n.id === l.note)?.title}
            </button>
          ))}
          <div className="actions">
            <button
              onClick={() =>
                newNote({
                  ...blank(),
                  title: t.title,
                  category: "Engineering Practices",
                  tags: [t.area, t.section],
                  sources: t.sources,
                  topic: t.id,
                })
              }
            >
              <Plus size={15} /> Моя заметка
            </button>
            <select
              aria-label="Существующая заметка"
              value={attach}
              onChange={(e) => S(e.target.value)}
            >
              <option value="">Выбрать материал</option>
              {s.notes
                .filter((n) => !linked.some((l) => l.note === n.id))
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
            </select>
            <button
              disabled={!attach}
              onClick={async () => {
                await act("attach", { topic: t.id, note: attach });
                S("");
              }}
            >
              <Link2 size={15} /> Привязать
            </button>
          </div>
        </section>
        <section className="panel road-panel">
          <h2>Самопроверка</h2>
          <p>{t.question}</p>
          {exams
            .filter((x) => x.topic === t.id)
            .map((x) => (
              <details key={x.id}>
                <summary>
                  {date(x.created)} ·{" "}
                  {
                    {
                      correct: "Правильно",
                      partial: "Частично",
                      miss: "Не смогла ответить",
                    }[x.result]
                  }
                </summary>
                <p>{x.response}</p>
              </details>
            ))}
        </section>
        {dialogs}
      </>
    );
  }
  return (
    <>
      <header className="page-head">
        <div className="spread">
          <h1>Learning Roadmap</h1>
          <button className="primary" onClick={() => V({})}>
            <Plus size={16} /> Новая тема
          </button>
        </div>
        <p>Программа подготовки к backend-интервью Middle и Senior.</p>
      </header>
      <div className="road-stats">
        {[
          [stats.percent + "%", "Тем освоено"],
          [stats.mastered + " / " + stats.total, "Освоено из видимых тем"],
          [stats.unchecked, "Навыков без проверки"],
          [
            topics.filter((t) => !t.hidden && weak(t)).length,
            "Тем к повторению",
          ],
        ].map(([v, l]) => (
          <div className="panel" key={l}>
            <b>{v}</b>
            <small>{l}</small>
          </div>
        ))}
      </div>
      <details className="panel road-panel">
        <summary>
          Как считается прогресс и какие разделы требуют внимания
        </summary>
        <p>
          Тема освоена, когда для каждого навыка вы отметили самостоятельное
          объяснение и практическое применение. Скрытые темы исключаются из
          знаменателя. До первой проверки готовность неизвестна.
        </p>
        {events.length > 0 ? (
          <>
            <h3>Разделы с наименьшей долей освоенных тем</h3>
            {weakSections.slice(0, 5).map((x) => (
              <p key={x.name}>
                {x.name} · {x.percent}%
              </p>
            ))}
            <h3>Динамика по дням</h3>
            {Array.from(historyByDay.values())
              .slice(-30)
              .map((e) => (
                <div className="row" key={e.id}>
                  {date(e.created)}
                  <small>
                    {e.mastered} / {e.total} тем
                  </small>
                </div>
              ))}
          </>
        ) : (
          <p>История появится после первой отметки.</p>
        )}
      </details>
      <details className="panel road-panel">
        <summary>Программа и официальные материалы Revolut</summary>
        <p>
          Этот учебный план составлен для самостоятельной подготовки. Уровни
          Middle и Senior — учебная оценка сложности. Подтверждённые сведения
          относятся к конкретным опубликованным материалам.
        </p>
        {contexts.map((c) => (
          <p key={c.title}>
            <strong>{c.title}</strong> · {c.claim}{" "}
            <a href={c.url} target="_blank" rel="noreferrer">
              Источник
            </a>{" "}
            · {c.checked}
          </p>
        ))}
      </details>
      <div className="filters">
        <label className="search-input">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => Q(e.target.value)}
            placeholder="Поиск по программе"
          />
        </label>
        <select
          aria-label="Направление"
          value={area}
          onChange={(e) => A(e.target.value)}
        >
          {["Все", ...distinct(topics.map((t) => t.area))].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select
          aria-label="Сложность"
          value={difficulty}
          onChange={(e) => F(e.target.value)}
        >
          {["Все", "Middle", "Senior"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="actions">
        <label className="inline">
          <input
            type="checkbox"
            checked={repeatOnly}
            onChange={(e) => O(e.target.checked)}
          />{" "}
          Нужно повторить
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => H(e.target.checked)}
          />{" "}
          Показать скрытые
        </label>
      </div>
      {group(list, "area").map(([a, areaTopics]) => {
        const pct = mastery(
          topics.filter((t) => t.area === a),
          marks,
        );
        return (
          <details
            key={a}
            className="panel syllabus-group"
            open={area !== "Все" || !!q || undefined}
          >
            <summary>
              {a}
              <small>
                {pct.mastered} / {pct.total} освоено · {pct.percent}%
              </small>
            </summary>
            {group(areaTopics, "section").map(([section, ts]) => (
              <section key={section}>
                <div className="section-head">
                  <h3>{section}</h3>
                  <button onClick={() => X(ts)}>Проверить знания</button>
                </div>
                {group(ts, "subsection").map(([sub, items]) => (
                  <div key={sub}>
                    <small>{sub}</small>
                    {items.map((t) => (
                      <button
                        className="row"
                        key={t.id}
                        onClick={() => navigate("roadmap/" + t.id)}
                      >
                        <BookOpen size={15} />
                        {t.title}
                        {t.hidden ? " · скрыта" : ""}
                        <small>
                          {t.difficulty} · {t.skills.length} навыка
                        </small>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                ))}
              </section>
            ))}
          </details>
        );
      })}
      {!list.length && <p>Тем по этим фильтрам нет.</p>}
      {dialogs}
    </>
  );
}
