"use client";
import { useState, useEffect, useRef } from "react";
import {authorName,authorRole,siteName} from "../src/identity";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Layers,
  LayoutDashboard,
  LibraryBig,
  Waypoints,
  MessagesSquare,
  FlaskConical,
  Languages,
  PenLine,
  Search,
  PanelLeft,
  Sun,
  Moon,
  Plus,
  ChevronRight,
  Terminal,
  FolderOpen,
  Settings2,
  Check,
  FileText,
  ArrowUpRight,
  CalendarDays,
  Command,
  BookOpen,
  ListChecks,
} from "lucide-react";
import {
  Note,
  State,
  Item,
  blank,
  api,
  categories,
  interviewCats,
  due,
  date,
  stages,
} from "../src/types";
import { Dashboard, Material, Review, Interview } from "../src/Views";
import { Modal, NoteForm, ItemForm, kindNames } from "../src/Forms";
import Workspace from "../src/Workspace";
import Roadmap from "../src/Roadmap";
const Graph = dynamic(() => import("../src/Graph"), { ssr: false });
const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["roadmap", "Learning Roadmap", ListChecks],
  ["library", "Knowledge Base", LibraryBig],
  ["graph", "Knowledge Graph", Waypoints],
  ["interview", "Interview Prep", MessagesSquare],
  ["review", "Spaced Repetition", Layers],
  ["lab", "Playground", FlaskConical],
  ["english", "English Lab", Languages],
  ["studio", "Content Studio", PenLine],
] as const;
const kinds = {
  interview: "question",
  review: "card",
  studio: "post",
  lab: "lab",
  english: "english",
  tasks: "task",
};
const descriptions = {
  library: "Материалы, источники и ваши инженерные наблюдения.",
  graph: "Переходите между концепциями по связям из ваших материалов.",
  interview:
    "Тренируйте ответы и сохраняйте вопросы, к которым нужно вернуться.",
  review: "Повторяйте концепции по персональному расписанию FSRS.",
  studio: "От первой идеи до опубликованного материала.",
  lab: "Фиксируйте эксперименты, варианты решений и результаты.",
  english: "Объясняйте инженерные концепции на английском.",
  tasks: "Планируйте конкретные шаги для изучения темы.",
};
import {useArticleSearch} from "../src/articles/search";
export default function Page() {
  const [s, S] = useState<State>(null),
    [route, R] = useState("dashboard"),
    [modal, M] = useState(""),
    [note, N] = useState<Note>(blank()),
    [item, I] = useState<Item>(null),
    [source, U] = useState(""),
    [target, V] = useState(""),
    [label, L] = useState(""),
    [q, Q] = useState(""),
    [hits, Y] = useState<string[]>([]),
    [cat, C] = useState("Все"),
    [folder, Z] = useState("Все источники"),
    [stage, F] = useState("Все"),
    [dark, D] = useState(false),
    [collapsed, B] = useState(false),
    [mobile, A] = useState(false),
    [msg, E] = useState(""),
    [tick, K] = useState(0);
  const timer = useRef<any>(null);
  function tell(m: string) {
    E(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => E(""), 5000);
  }
  async function refresh() {
    S(await api(""));
  }
  useEffect(() => {
    refresh().catch((e) => E(e.message));
    const nav = () => {
      R(decodeURIComponent(location.hash.slice(1)) || "dashboard");
      M("");
      A(false);
      window.scrollTo(0, 0);
    };
    nav();
    addEventListener("hashchange", nav);
    const saved = localStorage.getItem("hub-theme");
    D(saved === "dark");
    const t = setInterval(() => K((t) => t + 1), 30000);
    return () => {
      removeEventListener("hashchange", nav);
      clearInterval(t);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        Q("");
        M("search");
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.code === "KeyN") {
        e.preventDefault();
        newNote();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    let live = true;
    if (!q.trim()) {
      Y([]);
      return;
    }
    const t = setTimeout(
      () =>
        api("/search?q=" + encodeURIComponent(q))
          .then((v) => {
            if (live) Y(v);
          })
          .catch((e) => tell(e.message)),
      100,
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, s]);
  function navigate(p: string) {
    A(false);
    M("");
    Q("");
    location.hash = p;
  }
  function open(n: Note) {
    navigate("note/" + n.id);
  }
  function newNote(n = blank()) {
    N(n);
    M("note");
  }
  function make(kind: string, n?: Note, existing?: Item) {
    const title = n
      ? kind === "card" || kind === "question"
        ? n.prompt || "Как работает " + n.title + "?"
        : n.title
      : "";
    I(
      existing || {
        kind,
        title,
        note: n?.id || null,
        details: {
          category: kind === "question" ? "Coding" : "",
          stage: "Idea",
          format: "Telegram",
          answer:
            kind === "card" || kind === "question"
              ? n?.explanation || n?.body || ""
              : kind === "english"
                ? n?.english || ""
                : kind === "post"
                  ? n?.explanation || ""
                  : "",
          english: kind === "question" ? n?.english : "",
          sources: kind === "post" ? n?.sources : [],
        },
      },
    );
    M("item");
  }
  function link(key = "") {
    U(key || s.notes[0]?.id || "");
    V("");
    L("");
    M("link");
  }
  async function run(op: string, data: any) {
    try {
      await api("/" + op, data);
      await refresh();
      tell("Сохранено");
      return true;
    } catch (e) {
      tell(e.message);
      return false;
    }
  }
  async function remove(table: string, id: string) {
    if (!confirm("Удалить запись? Это действие необратимо.")) return;
    if (await run("delete", { table, id })) {
      M("");
      if (table === "notes") navigate("library");
    }
  }
  const p = route.split("/")[0],
    n = s?.notes.find((n) => n.id === route.split("/")[1]),
    title =
      nav.find((v) => v[0] === p)?.[1] ||
      (p === "note"
        ? "Learning Workspace"
        : p === "tasks"
          ? "Задачи"
          : "Dashboard"),
    kind = kinds[p],
    collection = s?.items.filter((i) => i.kind === kind) || [],
    matched = s?.notes.filter((n) => !q.trim() || hits.includes(n.id)) || [],
    foundItems = q.trim()
      ? s?.items.filter((i) =>
          (
            i.title +
            " " +
            Object.values(i.details)
              .filter((x) => typeof x === "string")
              .join(" ")
          )
            .toLowerCase()
            .includes(q.trim().toLowerCase()),
        ) || []
      : [];
  const publicMatches=useArticleSearch(modal==="search"?q:"");
  const library = matched.filter(
    (n) =>
      folder === "Все источники" ||
      (folder === "Папка карьеры"
        ? n.origin?.startsWith("Карьера — зарубежная компания/")
        : folder === "Скрининг"
          ? n.origin?.includes("/скрининг/")
          : !n.origin),
  );
  const switchTheme = () => {
    D(!dark);
    localStorage.setItem("hub-theme", dark ? "light" : "dark");
  };
  return (
    <div
      className={
        "shell " +
        (collapsed ? "collapsed " : "") +
        (mobile ? "mobile-open" : "")
      }
    >
      {mobile && (
        <button
          className="scrim"
          aria-label="Закрыть меню"
          onClick={() => A(false)}
        />
      )}
      <aside>
        <div className="brand">
          <span className="logo">
            <Layers size={23} />
          </span>
          <span>
            <strong>{siteName}</strong>
          </span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        {nav.map(([key, text, Icon], i) => (
          <div key={key}>
            {i === 4 && <><Link href="/articles/" className="nav article-nav" title="Все статьи"><LibraryBig size={18}/><span>Все статьи</span></Link><Link href="/concurrency/" className="nav article-nav" title="Многопоточность"><BookOpen size={18}/><span>Многопоточность</span></Link><div className="nav-label second">LEARNING TOOLS</div></>}
            <button
              className={
                "nav " +
                (p === key || (p === "note" && key === "library")
                  ? "selected"
                  : "")
              }
              onClick={() => navigate(key)}
              title={text}
            >
              <Icon size={18} />
              <span>{text}</span>
              {key === "review" && s?.items.some(due) && (
                <b>{s.items.filter(due).length}</b>
              )}
            </button>
          </div>
        ))}
        <div className="side-bottom">
          <div className="profile">
            <span className="avatar">ТТ</span>
            <div>
              <strong>{authorName}</strong>
              <small>{authorRole}</small>
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="actions">
            <button
              aria-label="Свернуть или открыть меню"
              onClick={() => (innerWidth < 800 ? A(!mobile) : B(!collapsed))}
            >
              <PanelLeft size={18} />
            </button>
            <span className="divider" />{" "}
            <span className="crumb">Workspace</span>
            <ChevronRight size={13} />
            <b>{title}</b>
          </div>
          <div className="actions">
            <button
              className="search-btn"
              onClick={() => {
                Q("");
                M("search");
              }}
            >
              <Search size={15} />
              <span>Найти…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button aria-label="Сменить тему" onClick={switchTheme}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <div className="content">
          {!s ? (
            <p>Загрузка библиотеки…</p>
          ) : p === "dashboard" ? (
            <Dashboard
              s={s}
              navigate={navigate}
              open={open}
              create={() => newNote()}
              editItem={make}
              run={run}
            />
          ) : p === "roadmap" ? (
            <Roadmap
              route={route}
              navigate={navigate}
              s={s}
              newNote={newNote}
            />
          ) : p === "note" ? (
            n ? (
              <Workspace
                key={n.id}
                n={n}
                s={s}
                open={open}
                edit={newNote}
                make={make}
                run={run}
                back={() => navigate("library")}
                link={link}
              />
            ) : (
              <button onClick={() => navigate("library")}>
                Материал недоступен · в библиотеку
              </button>
            )
          ) : (
            <>
              <div className="page-head">
                <div className="eyeline">
                  <span className="live-dot" /> БАЗА ЗНАНИЙ
                </div>
                <div className="spread">
                  <h1>{title}</h1>
                  <button
                    className="primary"
                    onClick={() =>
                      p === "graph"
                        ? link()
                        : p === "library"
                          ? newNote()
                          : make(kind)
                    }
                  >
                    <Plus size={16} />
                    {p === "graph"
                      ? "Создать связь"
                      : p === "library"
                        ? "Новый материал"
                        : "Добавить"}
                  </button>
                </div>
                <p>{descriptions[p]}</p>
              </div>
              {p === "library" && (
                <><Link href="/articles/" className="text-btn"><LibraryBig size={17}/> Открыть каталог статей для интервью</Link>
                  <div className="filters">
                    <label className="search-input">
                      <Search size={17} />
                      <input
                        placeholder="Поиск по тексту материалов"
                        value={q}
                        onChange={(e) => Q(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Папка материалов"
                      value={folder}
                      onChange={(e) => Z(e.target.value)}
                    >
                      {[
                        "Все источники",
                        "Папка карьеры",
                        "Скрининг",
                        "Созданные вручную",
                      ].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Категория"
                      value={cat}
                      onChange={(e) => C(e.target.value)}
                    >
                      {["Все", ...categories].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {categories
                    .filter((c) => cat === "Все" || cat === c)
                    .map((c) => {
                      const a = library.filter((n) => n.category === c);
                      return a.length ? (
                        <section key={c}>
                          <div className="section-head main-section">
                            <h2>{c}</h2>
                            <small>{a.length}</small>
                          </div>
                          <div className="materials">
                            {a.map((n) => (
                              <Material key={n.id} n={n} open={open} />
                            ))}
                          </div>
                        </section>
                      ) : null;
                    })}
                  {!library.some(
                    (n) => cat === "Все" || cat === n.category,
                  ) && <p className="empty">Материалы не найдены.</p>}
                </>
              )}
              {p === "graph" && <Graph s={s} open={open} />}{" "}
              {p === "review" && <Review items={s.items} run={run} />}{" "}
              {p === "interview" && <Interview items={s.items} run={run} />}
              {kind && (
                <>
                  <div className="section-head main-section">
                    <h2>
                      {p === "review"
                        ? "Все карточки"
                        : p === "interview"
                          ? "Каталог вопросов"
                          : "Мои записи"}
                    </h2>
                    {p === "studio" && (
                      <select
                        value={stage}
                        onChange={(e) => F(e.target.value)}
                        aria-label="Этап"
                      >
                        {["Все", ...stages].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="panel">
                    {collection
                      .filter(
                        (i) =>
                          p !== "studio" ||
                          stage === "Все" ||
                          i.details.stage === stage,
                      )
                      .map((i) => (
                        <div key={i.id} className="record">
                          <button
                            className="row"
                            onClick={() => make(kind, undefined, i)}
                          >
                            <span>{i.title}</span>
                            <small>
                              {kind === "card"
                                ? date(i.details.schedule.due)
                                : kind === "post"
                                  ? i.details.stage
                                  : kind === "task"
                                    ? i.details.done
                                      ? "Готово"
                                      : "Открыто"
                                    : kind === "question"
                                      ? i.details.category
                                      : ""}
                            </small>
                            <ChevronRight size={15} />
                          </button>
                          {i.note && (
                            <button
                              className="text-btn"
                              onClick={() => navigate("note/" + i.note)}
                            >
                              <BookOpen size={13} />
                              {s.notes.find((n) => n.id === i.note)?.title}
                            </button>
                          )}
                          {kind === "task" && (
                            <button
                              onClick={() =>
                                run("item", {
                                  ...i,
                                  details: {
                                    ...i.details,
                                    done: !i.details.done,
                                  },
                                })
                              }
                            >
                              {i.details.done ? "Открыть снова" : "Завершить"}
                            </button>
                          )}
                          {kind === "english" && (
                            <button
                              onClick={() => {
                                make("card");
                                I({
                                  kind: "card",
                                  note: i.note,
                                  title: i.title,
                                  details: { answer: i.details.answer },
                                });
                              }}
                            >
                              В карточки
                            </button>
                          )}
                        </div>
                      ))}
                    {!collection.filter(
                      (i) =>
                        p !== "studio" ||
                        stage === "Все" ||
                        i.details.stage === stage,
                    ).length && (
                      <p className="muted">
                        Записей пока нет. Добавьте первую или создайте её из
                        материала.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {s && modal === "note" && (
        <Modal
          wide
          title={note.id ? "Редактировать материал" : "Новый материал"}
          close={() => M("")}
        >
          <NoteForm
            initial={note}
            remove={remove}
            save={async (d) => {
              const r = await api("/note", d);
              await refresh();
              navigate("note/" + r.id);
              tell("Материал сохранён");
            }}
          />
        </Modal>
      )}
      {s && modal === "item" && (
        <Modal wide title={kindNames[item.kind]} close={() => M("")}>
          <ItemForm
            initial={item}
            state={s}
            remove={remove}
            save={async (d) => {
              await api("/item", d);
              await refresh();
              M("");
              tell("Запись сохранена");
            }}
          />
        </Modal>
      )}
      {s && modal === "link" && (
        <Modal title="Создать связь" close={() => M("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run("link", { source, target, label })) M("");
            }}
          >
            <label>
              Из материала
              <select value={source} onChange={(e) => U(e.target.value)}>
                {s.notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              В материал
              <select
                required
                value={target}
                onChange={(e) => V(e.target.value)}
              >
                <option value="">Выберите материал</option>
                {s.notes
                  .filter((n) => n.id !== source)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Как связаны темы?
              <input
                required
                value={label}
                onChange={(e) => L(e.target.value)}
              />
            </label>
            <footer>
              <button className="primary">Сохранить связь</button>
            </footer>
          </form>
        </Modal>
      )}
      {s && modal === "search" && (
        <Modal title="Поиск по лаборатории" close={() => M("")}>
          <label className="search-input">
            <Search size={17} />
            <input
              autoFocus
              value={q}
              onChange={(e) => Q(e.target.value)}
              placeholder="Тема, фраза, вопрос…"
            />
          </label>
          <div className="results">
            {publicMatches.slice(0,12).map(a=><Link key={a.slug} className="row" href={'/articles/'+a.slug+'/'}><BookOpen size={16}/>{a.title}<small>Статья</small></Link>)}
            {matched.slice(0, 40).map((n) => (
              <button className="row" key={n.id} onClick={() => open(n)}>
                <FileText size={16} />
                {n.title}
                <small>{n.category}</small>
              </button>
            ))}
            {foundItems.slice(0, 40).map((i) => (
              <button
                key={i.id}
                className="row"
                onClick={() => make(i.kind, undefined, i)}
              >
                {i.title}
                <small>{kindNames[i.kind]}</small>
              </button>
            ))}
            {!matched.length && !foundItems.length && <p>В личных записях совпадений нет.</p>}
            <Link className="row" href={q.trim()?{pathname:"/articles/",query:{q:q.trim()}}:"/articles/"}><BookOpen size={16}/>{q.trim()?"Искать в опубликованных статьях":"Все опубликованные статьи"}</Link>
          </div>
        </Modal>
      )}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </div>
  );
}
