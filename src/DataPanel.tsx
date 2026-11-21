"use client";
import { useState } from "react";
import { backup, restore, resetProgress, markdownExport } from "./client";
export default function DataPanel({ refresh }: { refresh: any }) {
  const [overwrite, O] = useState(false),
    [msg, M] = useState(""),
    [busy, B] = useState(false);
  async function act(fn: any) {
    B(true);
    try {
      const text = await fn();
      await refresh();
      M(text || "Готово.");
    } catch (e) {
      M(e.message);
    } finally {
      B(false);
    }
  }
  return (
    <>
      <p>
        Данные находятся в IndexedDB этого браузера. Для переноса на другое
        устройство сохраните JSON и импортируйте его на новом устройстве.
      </p>
      <div className="actions">
        <button disabled={busy} onClick={() => act(() => backup("all"))}>
          Export All Data
        </button>
        <button disabled={busy} onClick={() => act(() => backup("progress"))}>
          Export Progress
        </button>
        <button disabled={busy} onClick={() => act(markdownExport)}>
          Markdown + изображения
        </button>
      </div>
      <label className="inline">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => O(e.target.checked)}
        />{" "}
        При совпадении ID использовать версию из копии
      </label>
      <p>
        По умолчанию импорт добавляет отсутствующие записи и сохраняет
        существующие.
      </p>
      <label>
        Import Data · JSON
        <input
          type="file"
          disabled={busy}
          accept=".json,application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (
              overwrite &&
              !confirm("Заменить совпадающие записи версиями из файла?")
            )
              return;
            act(async () => {
              const v = await restore(f, overwrite);
              return (
                "Добавлено " +
                v.added +
                " · различающихся совпадений " +
                v.conflicts +
                " · пропущено без исходного материала " +
                v.skipped
              );
            });
          }}
        />
      </label>
      <button
        disabled={busy}
        onClick={() => {
          if (
            confirm(
              "Сбросить статусы заметок и навыков, оценки, экзамены и расписание карточек? Материалы сохранятся. Перед сбросом будет скачана копия прогресса.",
            )
          )
            act(async () => {
              await backup("progress");
              await resetProgress();
            });
        }}
      >
        Reset Progress
      </button>
      <p role="status">{msg}</p>
    </>
  );
}
