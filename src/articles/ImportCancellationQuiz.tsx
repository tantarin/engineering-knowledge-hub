"use client";

import { useState } from "react";

const questions = [
  {
    prompt: "Future.get(5, SECONDS) выбросил TimeoutException. Что произошло?",
    options: ["Импорт автоматически остановился", "Рабочий поток был уничтожен", "Обработчик закончил ожидание, импорт может продолжаться"],
    correct: 2, reason: "У get() истёк срок ожидания. Отмену задачи никто ещё не запрашивал.",
  },
  {
    prompt: "Что означает cancel(true) у Future задачи из стандартного пула?",
    options: ["Задача уже остановилась", "Исполнителю разрешено попытаться прервать рабочий поток", "Все транзакции отменены"],
    correct: 1, reason: "Это запрос отмены. Начавшаяся работа может продолжаться, а предыдущие COMMIT сохраняются.",
  },
  {
    prompt: "Вызовет ли CompletableFuture.cancel(true) прерывание рабочего потока?",
    options: ["Да", "Нет"],
    correct: 1, reason: "В Java 21 этот параметр у CompletableFuture не управляет прерыванием потока.",
  },
];

export function Question({ item }: { item: typeof questions[number] }) {
  const [selected, select] = useState<number>();
  return <fieldset><legend>{item.prompt}</legend>
    {item.options.map((option, i) => <label key={option} style={{display:"block"}}>
      <input type="radio" name={item.prompt} checked={selected === i} onChange={() => select(i)} /> {option}
    </label>)}
    <p role="status">{selected !== undefined && (selected === item.correct ? "Верно. " : "Попробуй ещё раз. ") + item.reason}</p>
  </fieldset>;
}

export function ImportCancellationQuiz() {
  return <section><h2>Проверь понимание</h2>
    {questions.map(item => <Question key={item.prompt} item={item} />)}
  </section>;
}
