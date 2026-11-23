"use client";

import { useState } from "react";

type Step = [accountA: string, accountB: string, thread1: string, thread2: string, explanation: string];
const blocked: Step[] = [
  ["Свободен", "Свободен", "Готов", "Готов", "Оба перевода готовы начаться. Балансы A и B пока равны 1 000 и 2 000 ₽."],
  ["У потока 1", "Свободен", "Захватил A", "Готов", "Поток 1 вошёл в synchronized (from). Его отправитель — A."],
  ["У потока 1", "У потока 2", "Держит A", "Захватил B", "До входа потока 1 во внутренний блок успел стартовать поток 2. Его отправитель — B."],
  ["У потока 1", "У потока 2", "Держит A, ждёт B", "Держит B, ждёт A", "Цикл замкнулся: поток 1 ждёт поток 2, а поток 2 ждёт поток 1. Ни один не дошёл до изменения балансов."],
];
const ordered: Step[] = [
  ["Свободен", "Свободен", "Готов", "Готов", "Оба перевода начинаются с попытки захватить A: у него меньший id."],
  ["У потока 1", "Свободен", "Захватил A", "Ждёт A", "В этом запуске первым вошёл поток 1. Поток 2 ждёт перед внешним блоком и пока ничем не владеет."],
  ["У потока 1", "У потока 1", "Переводит 100 ₽", "Ждёт A", "B свободен. Поток 1 захватывает его и переводит 100 ₽ с A на B. Теперь на A — 900 ₽, на B — 2 100 ₽."],
  ["Свободен", "Свободен", "Завершён", "Может захватить A", "Поток 1 вышел из обоих блоков. Сначала освободился B, затем A."],
  ["У потока 2", "У потока 2", "Завершён", "Переводит 200 ₽", "Поток 2 захватывает A, затем B. Источник денег по-прежнему B. После списания и зачисления на A — 1 100 ₽, на B — 1 900 ₽."],
  ["Свободен", "Свободен", "Завершён", "Завершён", "Поток 2 освободил оба монитора. Оба перевода выполнены."],
];

export function TransferSteps({ consistentOrder = false }: { consistentOrder?: boolean }) {
  const steps = consistentOrder ? ordered : blocked;
  const [index, setIndex] = useState(0);
  const [a, b, first, second, explanation] = steps[index];
  return <section className="panel road-panel" aria-label={consistentOrder ? "Единый порядок захвата" : "Цикл ожидания"}>
    <div aria-live="polite">
      <strong>Шаг {index + 1} из {steps.length}</strong>
      <table><thead><tr><th>Счёт A · id 1</th><th>Счёт B · id 2</th></tr></thead><tbody><tr><td>{a}</td><td>{b}</td></tr></tbody></table>
      <p><b>Поток 1 · A → B</b> — {first}<br/><b>Поток 2 · B → A</b> — {second}</p>
      <p>{explanation}</p>
    </div>
    <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Назад</button>{" "}
    <button type="button" disabled={index === steps.length - 1} onClick={() => setIndex(index + 1)}>Следующий шаг</button>
  </section>;
}

export function TransferQuiz() {
  const [choice, setChoice] = useState<number>();
  const answers = ["Да, возникнет deadlock", "Нет, потому что потоков три", "Нет, JVM автоматически освободит блокировку"];
  const feedback = ["Верно. Поток 1 ждёт поток 2, тот ждёт поток 3, а поток 3 ждёт поток 1. Цикл может включать больше двух потоков.", "Проследи последнюю связь: третий поток ждёт A, которым владеет первый. Так цепочка замыкается.", "Монитор освобождается при выходе из блока. Здесь каждый поток застрял до выхода и продолжает удерживать свой монитор."];
  return <fieldset><legend>Возникнет ли взаимная блокировка?</legend>
    {answers.map((answer, i) => <label key={answer} style={{display:"block"}}><input type="radio" name="deadlock-quiz" checked={choice === i} onChange={() => setChoice(i)} /> {answer}</label>)}
    <p role="status">{choice === undefined ? "" : feedback[choice]}</p>
  </fieldset>;
}
