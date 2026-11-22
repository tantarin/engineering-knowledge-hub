import guide from "./career-guide.json" with { type: "json" };
import java from "./career-java.json" with { type: "json" };
import data from "./career-data.json" with { type: "json" };
import design from "./career-design.json" with { type: "json" };
import gc from "./career-gc.json" with { type: "json" };
import storage from "./career-storage.json" with { type: "json" };
import kubernetes from "./career-kubernetes.json" with { type: "json" };
import microservices from "./career-microservices.json" with { type: "json" };
export const articles = [
  ...guide,
  ...java,
  ...data,
  ...design,
  ...gc,
  ...storage,
  ...kubernetes,
  ...microservices,
];
