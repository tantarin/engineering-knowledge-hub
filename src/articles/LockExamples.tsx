"use client";

import { useState } from "react";

export function LockScenarios() {
  const [acquired, setAcquired] = useState(false);
  return <fieldset>
    <legend>Сколько времени принтер оставался занят?</legend>
    <label><input type="radio" name="lock-outcome" checked={!acquired} onChange={() => setAcquired(false)} /> Все 50 мс</label>{" "}
    <label><input type="radio" name="lock-outcome" checked={acquired} onChange={() => setAcquired(true)} /> Освободился через 30 мс</label>
    <p aria-live="polite">{acquired
      ? "30 мс ожидания + 100 мс работы с принтером ≈ 130 мс. tryLock вернул true на 30-й мс. Только после обеих команд метод printLabel возвращает true."
      : "Прошло 50 мс, поток B так и не захватил блокировку. tryLock вернул false, printLabel вернул false. B не отправил принтеру ни одной команды."}</p>
  </fieldset>;
}

export function InterviewAnswer({ answer }: { answer: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(answer);
      setStatus("Скопировано");
    } catch {
      setStatus("Выделите текст ответа и скопируйте его вручную.");
    }
  }
  return <section lang="en"><h2 lang="ru">Короткий ответ на английском</h2>
    <p><strong>What is the difference between synchronized and ReentrantLock?</strong></p>
    <p>{answer}</p>
    <button type="button" onClick={copy}>Copy answer</button>{" "}
    <span lang="ru" role="status">{status}</span>
  </section>;
}
