import { chapters, entries } from "./library";
import { articles } from "./concurrency";

type Lesson = { title: string; href: string };
type Section = { title: string; lessons: Lesson[] };
export type MenuTopic = { title: string; sections: Section[] };

function chapter(id: string): Section {
  const item = chapters.find(c => c.id === id)!;
  return { title: item.title, lessons: item.lessons.map(a => ({ title: a.title, href: `/articles/${a.slug}/` })) };
}

const storage = chapter("queries-storage");
const isNoSQL = (lesson: Lesson) => ["/articles/mongo-shard-key/", "/articles/redis-cache-aside/"].includes(lesson.href);
export const menuTopics: MenuTopic[] = [
  { title: "Java · многопоточность", sections: [
    chapter("java-basics"), chapter("synchronization"), chapter("executors"),
    { title: "Практикум Java", lessons: articles.map(a => ({ title: a.title, href: `/concurrency/${a.slug}/` })) },
  ] },
  { title: "JVM и сборка мусора", sections: [chapter("jvm-gc")] },
  { title: "PostgreSQL и SQL", sections: [chapter("transactions"), { ...storage, lessons: storage.lessons.filter(l => !isNoSQL(l)) }] },
  { title: "Redis и MongoDB", sections: [{ title: "Хранение и кэширование", lessons: storage.lessons.filter(isNoSQL) }] },
  { title: "Микросервисы", sections: [chapter("boundaries")] },
  { title: "Kafka и события", sections: [chapter("kafka"), chapter("events")] },
  { title: "Spring", sections: [chapter("spring")] },
  { title: "Kubernetes и Helm", sections: [chapter("kubernetes")] },
  { title: "System Design", sections: [chapter("design-practice")] },
  { title: "Базовое техническое интервью", sections: [{
    title: "Подготовка к технической части",
    lessons: [
      "concurrency-and-parallelism", "race-conditions", "thread-pools",
      "postgres-index-and-plan", "thread-safe-transfer", "java-interview-rehearsal",
    ].map(slug => {
      const article = entries.find(entry => entry.slug === slug)!;
      return { title: article.title, href: `/articles/${slug}/` };
    }),
  }] },
  { title: "Карьера", sections: [chapter("job-search")] },
];
