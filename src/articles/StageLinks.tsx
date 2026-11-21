import Link from "next/link";
import stages from "./interview-stages.json";
export function StageLinks() {
  return (
    <section
      className="stage-links"
      aria-label="Подготовка к собеседованию в Revolut"
    >
      <h2>Собеседование в Revolut</h2>
      <p>
        Маршрут по личному опыту интервью. Основная тренировка — live coding и
        техническая теория.
      </p>
      <div>
        {stages.map((stage) => (
          <Link
            className="stage-card"
            href={"/revolut/" + stage.id + "/"}
            key={stage.id}
          >
            <small>{stage.label}</small>
            <strong>{stage.title}</strong>
            {stage.duration && <small>{stage.duration}</small>}
          </Link>
        ))}
      </div>
    </section>
  );
}
