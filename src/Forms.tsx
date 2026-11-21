"use client";
import { useState, useRef, useEffect } from "react";
import {
  X,
  ImagePlus,
  Eye,
  Pencil,
  History,
  Save,
  Trash2,
  Heading2,
  Code2,
  Bold,
} from "lucide-react";
import {
  Note,
  Item,
  State,
  api,
  categories,
  statuses,
  interviewCats,
  stages,
} from "./types";
import MD from "./Markdown";
export const kindNames: Record<string, string> = {
  question: "Вопрос интервью",
  card: "Карточка повторения",
  post: "Публикация",
  lab: "Эксперимент",
  english: "Английская практика",
  task: "Задача",
};
export function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: any;
  wide?: boolean;
}) {
  const r = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = r.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={r}
      className={wide ? "wide" : ""}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button onClick={close} aria-label="Закрыть">
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function NoteForm({
  initial,
  save,
  remove,
}: {
  initial: Note;
  save: any;
  remove: any;
}) {
  const [n, set] = useState(initial),
    [tags, T] = useState(n.tags.join(", ")),
    [sources, S] = useState(n.sources.join("\n")),
    [preview, P] = useState(false),
    [hist, H] = useState<any[]>([]),
    [show, A] = useState(false),
    [err, E] = useState(""),
    [busy, B] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null),
    file = useRef<HTMLInputElement>(null);
  const update = (k: string, v: any) => set((s) => ({ ...s, [k]: v }));
  function insert(text: string) {
    const a = area.current,
      start = a?.selectionStart ?? n.body.length,
      end = a?.selectionEnd ?? start;
    set((s) => ({
      ...s,
      body: s.body.slice(0, start) + text + s.body.slice(end),
    }));
    requestAnimationFrame(() => {
      a?.focus();
      a?.setSelectionRange(start + text.length, start + text.length);
    });
  }
  async function upload(f?: File) {
    if (!f) return;
    try {
      const r = await api("/upload", f);
      insert("\n![Иллюстрация](" + r.url + ")\n");
    } catch (e) {
      E(e.message);
    }
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        try {
          await save({
            ...n,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            sources: sources
              .split("\n")
              .map((t) => t.trim())
              .filter(Boolean),
          });
        } catch (e) {
          E(e.message);
        } finally {
          B(false);
        }
      }}
    >
      <label>
        Название
        <input
          required
          autoFocus
          maxLength={240}
          value={n.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </label>
      <div className="fields">
        <label>
          Категория
          <select
            value={n.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select
            value={n.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {statuses.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Понимание
          <select
            value={n.level}
            onChange={(e) => update("level", +e.target.value)}
          >
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v} / 5
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="toolbar">
        {[
          [Heading2, "\n## "],
          [Bold, "**текст**"],
          [Code2, "\n```sql\nSELECT 1;\n```\n"],
        ].map(([Icon, s]: any) => (
          <button
            type="button"
            key={s}
            aria-label={"Вставить " + s}
            onClick={() => insert(s)}
          >
            <Icon size={17} />
          </button>
        ))}
        <button
          type="button"
          aria-label="Добавить изображение"
          onClick={() => file.current?.click()}
        >
          <ImagePlus size={17} />
        </button>
        <input
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          ref={file}
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <button type="button" onClick={() => P(!preview)}>
          {preview ? <Pencil size={16} /> : <Eye size={16} />}{" "}
          {preview ? "Редактор" : "Просмотр"}
        </button>
      </div>
      {preview ? (
        <MD text={n.body} />
      ) : (
        <textarea
          aria-label="Текст Markdown"
          ref={area}
          rows={12}
          className="editor"
          placeholder="## Как это работает?"
          value={n.body}
          onChange={(e) => update("body", e.target.value)}
          onPaste={(e) => {
            const f = e.clipboardData.files[0];
            if (f) {
              e.preventDefault();
              upload(f);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files[0]);
          }}
        />
      )}
      <label>
        Теги через запятую
        <input value={tags} onChange={(e) => T(e.target.value)} />
      </label>
      <label>
        Источники · по одной ссылке в строке
        <textarea
          rows={2}
          value={sources}
          onChange={(e) => S(e.target.value)}
        />
      </label>
      <label>
        Вопрос для самопроверки
        <input
          value={n.prompt}
          onChange={(e) => update("prompt", e.target.value)}
        />
      </label>
      {n.id && (
        <button
          type="button"
          onClick={async () => {
            H(await api("/history/" + n.id));
            A(!show);
          }}
        >
          <History size={16} /> История версий
        </button>
      )}
      {show && (
        <div>
          {hist.length
            ? hist.map((h) => (
                <details key={h.id}>
                  <summary>{new Date(h.created).toLocaleString()}</summary>
                  <MD text={JSON.parse(h.snapshot).body} />
                </details>
              ))
            : "Это первая версия."}
        </div>
      )}
      {err && <p role="alert">{err}</p>}
      <footer>
        {n.id && (
          <button type="button" onClick={() => remove("notes", n.id)}>
            <Trash2 size={15} /> Удалить
          </button>
        )}
        <button className="primary" disabled={busy}>
          <Save size={16} /> Сохранить материал
        </button>
      </footer>
    </form>
  );
}
export function ItemForm({
  initial,
  state,
  save,
  remove,
}: {
  initial: Item;
  state: State;
  save: any;
  remove: any;
}) {
  const [v, V] = useState(initial),
    [err, E] = useState(""),
    [busy, B] = useState(false);
  const k = v.kind,
    d = v.details,
    upd = (key: string, value: any) =>
      V({ ...v, details: { ...d, [key]: value } });
  const field = (key: string, label: string, rows = 3) => (
    <label>
      {label}
      <textarea
        rows={rows}
        value={d[key] || ""}
        onChange={(e) => upd(key, e.target.value)}
      />
    </label>
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        try {
          await save(v);
        } catch (e) {
          E(e.message);
        } finally {
          B(false);
        }
      }}
    >
      <label>
        {["card", "question"].includes(k) ? "Вопрос" : "Название"}
        <input
          required
          autoFocus
          value={v.title}
          maxLength={240}
          onChange={(e) => V({ ...v, title: e.target.value })}
        />
      </label>
      <label>
        Связанный материал
        <select
          value={v.note || ""}
          onChange={(e) => V({ ...v, note: e.target.value || null })}
        >
          <option value="">Без привязки</option>
          {state.notes.map((n) => (
            <option value={n.id} key={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      </label>
      {k === "question" && (
        <label>
          Тема интервью
          <select
            value={d.category || interviewCats[0]}
            onChange={(e) => upd("category", e.target.value)}
          >
            {interviewCats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      {k === "post" && (
        <div className="fields">
          <label>
            Этап
            <select
              value={d.stage || "Idea"}
              onChange={(e) => upd("stage", e.target.value)}
            >
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Формат
            <select
              value={d.format || "Telegram"}
              onChange={(e) => upd("format", e.target.value)}
            >
              {["Telegram", "LinkedIn", "Short video"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Дата публикации
            <input
              type="date"
              value={d.date || ""}
              onChange={(e) => upd("date", e.target.value)}
            />
          </label>
        </div>
      )}
      {k === "english" && field("attempt", "Мой ответ на английском")}
      {k === "lab" &&
        field("attempt", "Условие и варианты решения · Markdown", 5)}
      {field(
        "answer",
        (
          {
            post: "Полная версия · Markdown",
            lab: "Результаты и trade-offs · Markdown",
            english: "Пример объяснения",
            task: "Описание",
          } as any
        )[k] || "Ответ · Markdown",
        6,
      )}
      {k === "post" && (
        <>
          {field("short", "Короткая версия")}
          <label>
            Источники
            <textarea
              value={(d.sources || []).join("\n")}
              onChange={(e) =>
                upd("sources", e.target.value.split("\n").filter(Boolean))
              }
            />
          </label>
        </>
      )}
      {k === "question" && field("english", "Ответ на английском")}
      {err && <p role="alert">{err}</p>}
      <footer>
        {v.id && (
          <button type="button" onClick={() => remove("items", v.id)}>
            <Trash2 size={15} /> Удалить
          </button>
        )}
        <button className="primary" disabled={busy}>
          <Save size={15} />{" "}
          {k === "card" && !v.id ? "Подтвердить карточку" : "Сохранить"}
        </button>
      </footer>
    </form>
  );
}
