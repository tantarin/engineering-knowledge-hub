import guide from "./career-guide.json" with { type: "json" };
import java from "./career-java.json" with { type: "json" };
import data from "./career-data.json" with { type: "json" };
import design from "./career-design.json" with { type: "json" };
import gc from "./career-gc.json" with { type: "json" };
import storage from "./career-storage.json" with { type: "json" };
import kubernetes from "./career-kubernetes.json" with { type: "json" };
import microservices from "./career-microservices.json" with { type: "json" };
import springAndHelm from "./career-frameworks.json" with { type: "json" };
import messagingAndStorage from "./career-messaging.json" with { type: "json" };
import streams from "./career-streams.json" with { type: "json" };
import coreLessons from "./java-core-lessons.json" with { type: "json" };
import coreSupplements from "./java-core-supplements.json" with { type: "json" };
const existing = [
  ...guide,
  ...java,
  ...data,
  ...design,
  ...gc,
  ...storage,
  ...kubernetes,
  ...microservices,
  ...springAndHelm,
  ...messagingAndStorage,
  ...streams,
];

const supplements = new Map(coreSupplements.map(lesson => [lesson.slug, lesson]));
export const articles = [
  ...existing.map(article => {
    const lesson = supplements.get(article.slug);
    if (!lesson) return article;
    return {
      ...article,
      body: article.body + "\n\n## Практикум Java Core\n\n" + lesson.body,
      exercise: lesson.exercise,
      interview: article.interview ?? lesson.interview,
    };
  }),
  ...coreLessons,
];
