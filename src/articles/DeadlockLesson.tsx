import { TransferSteps, TransferQuiz } from "./TransferSteps";
import { InterviewAnswer } from "./LockExamples";
import type { Article } from "./concurrency";

export function DeadlockLesson({ article }: { article: Article }) {
  return <>
    <h2>1. Как перевод защищает два баланса?</h2>
    <p>{article.scenario}</p>
    <pre><code>{article.code}</code></pre>
    <p>Каждый объект Account здесь одновременно хранит баланс и служит монитором. Поток входит во внешний блок и удерживает монитор отправителя. Затем пытается войти во внутренний блок для получателя. Лишь после этого transferUnderLock списывает деньги у from и зачисляет их на to.</p>
    <h2>2. Как два правильных по отдельности перевода застревают?</h2>
    <p>Выполни четыре шага. После каждого посмотри, у кого A, у кого B и какой счёт нужен дальше.</p>
    <TransferSteps />
    <p>{article.analysis}</p>
    <h2>3. Что изменится, если оба потока начнут со счёта A?</h2>
    <p>Договоримся брать счета по возрастанию id. У A идентификатор 1, у B — 2. Для обоих переводов порядок блокировок теперь один. Аргументы from и to сохраняют направление движения денег.</p>
    <pre><code>{`void transfer(Account from, Account to, long amount) {
    if (from.id() == to.id()) return;

    Account first = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            transferUnderLock(from, to, amount);
        }
    }
}`}</code></pre>
    <TransferSteps consistentOrder />
    <p>Такой приём называется <strong>lock ordering</strong> — единый порядок захвата блокировок. Даже если первым стартует перевод B → A, он начнёт с захвата A. Другой поток будет ждать A с пустыми руками, поэтому первый сможет получить B и закончить.</p>
    <h2>4. Почему единый порядок разрывает цикл?</h2>
    <p>В первом сценарии одновременно выполнялись четыре условия Коффмана.</p>
    <table><thead><tr><th>Условие</th><th>Где оно в переводе</th></tr></thead><tbody>
      <tr><th scope="row">Mutual exclusion · взаимное исключение</th><td>У монитора счёта в каждый момент один владелец.</td></tr>
      <tr><th scope="row">Hold and wait · удержание и ожидание</th><td>Каждый поток сохранил первый монитор, пока ждал второй.</td></tr>
      <tr><th scope="row">No preemption · без принудительного освобождения</th><td>Ожидающий поток не может отобрать монитор у владельца.</td></tr>
      <tr><th scope="row">Circular wait · циклическое ожидание</th><td>Путь ожидания вернулся к началу: поток 1 → поток 2 → поток 1.</td></tr>
    </tbody></table>
    <p>Достаточно исключить одно условие. Порядок по id исключает последнее: если поток уже владеет счётом, он может запросить только следующий, с бо́льшим id. Чтобы замкнуть цикл, пришлось бы в какой-то момент пойти от большего id к меньшему.</p>
    <p>Для этой гарантии id должны быть уникальными и неизменяемыми. Внутри JVM все операции с одним логическим счётом должны использовать один объект блокировки. Все участки кода, которым нужны несколько счетов, обязаны брать их в том же порядке.</p>
    <h2>5. А если переводы обрабатывают разные JVM?</h2>
    <p>У двух экземпляров сервиса разные объекты Account даже для одного номера счёта. Если балансы хранятся в PostgreSQL, общей точкой координации могут служить строки таблицы. Ниже одна транзакция для перевода 200 ₽ с B на A. Предположим, что оба счёта существуют и средств достаточно.</p>
    <pre><code>{`BEGIN;
SELECT id, balance FROM accounts WHERE id = 1 FOR UPDATE;
SELECT id, balance FROM accounts WHERE id = 2 FOR UPDATE;

UPDATE accounts SET balance = balance - 200 WHERE id = 2;
UPDATE accounts SET balance = balance + 200 WHERE id = 1;
COMMIT;`}</code></pre>
    <p>Обе строки заблокированы до списания. Та же последовательность SELECT нужна и для обратного перевода. В реальном обработчике после захвата строк проверяют их наличие и доступный баланс. Если другие части транзакции захватывают дополнительные ресурсы, там всё ещё может образоваться цикл. PostgreSQL обнаруживает его и прерывает одну транзакцию с кодом 40P01 (deadlock_detected). Когда повтор безопасен, заново выполняют всю транзакцию, включая чтение и проверки. <a href="https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS">PostgreSQL · Deadlocks</a></p>
    <InterviewAnswer question="What is a deadlock and how can you prevent it?" answer="A deadlock occurs when threads wait indefinitely in a cycle. For example, one thread holds account A and waits for B, while another holds B and waits for A. I prevent this by acquiring account locks in ascending ID order for every transfer. That removes circular wait for those locks. Across JVMs, I coordinate updates in a shared system, such as the database." />
    <h2>7. Проверь понимание</h2>
    <p>У A id 1, у B id 2, у C id 3. Первый поток держит A и ждёт B. Второй держит B и ждёт C. Третий держит C и ждёт A. Никто не отпускает свой счёт до получения второго.</p>
    <TransferQuiz />
    <p><a href={article.source}>Oracle · Deadlock</a></p>
  </>;
}
