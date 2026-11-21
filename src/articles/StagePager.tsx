"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import stages from "./interview-stages.json";
export default function StagePager({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const id = useSearchParams().get("stage"),
    stage = stages.find((s) => s.id === id);
  const index = stage?.lessons.findIndex((l) => l.slug === slug) ?? -1;
  if (!stage || index < 0) return children;
  const next = stage.lessons[index + 1];
  return (
    <nav className="lesson-pager" aria-label="Подготовка к этапу">
      <Link href={"/revolut/" + id + "/"}>
        <small>
          {stage.label} · Материал {index + 1} из {stage.lessons.length}
        </small>
        {stage.title}
      </Link>
      {next ? (
        <Link
          href={{
            pathname: "/articles/" + next.slug + "/",
            query: { stage: id },
          }}
        >
          <small>Далее по этапу</small>
          {next.task}
        </Link>
      ) : (
        <Link href={"/revolut/" + id + "/#practice"}>
          <small>Последняя статья этапа</small>Перейти к репетиции
        </Link>
      )}
    </nav>
  );
}
