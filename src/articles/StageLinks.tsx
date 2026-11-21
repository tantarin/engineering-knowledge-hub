import Link from "next/link";
import stages from "./interview-stages.json";
export function StageLinks() {
  return (
    <section
      className="stage-links"
      aria-label="Подготовка к собеседованию в Revolut"
    >
      <h2>Собеседование в Revolut</h2>
      <div>
        {stages.map((stage) => (
          <Link
            className="stage-card"
            href={"/revolut/" + stage.id + "/"}
            key={stage.id}
          >
            <small>{stage.label}</small>
            <strong>{stage.title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
