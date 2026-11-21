export type Note = {
  origin?: string;
  id?: string;
  title: string;
  category: string;
  body: string;
  tags: string[];
  sources: string[];
  status: string;
  level: number;
  practice: string;
  explanation: string;
  prompt: string;
  english: string;
  updated?: string;
  created?: string;
};
export type Item = {
  id?: string;
  kind: string;
  title: string;
  note: string | null;
  details: Record<string, any>;
  updated?: string;
};
export type Link = {
  id: string;
  source: string;
  target: string;
  label: string;
};
export type State = {
  notes: Note[];
  items: Item[];
  links: Link[];
  reviews: { id: string; card: string; created: string; rating: number }[];
};
export const categories = [
  "Java 21",
  "Scala",
  "PostgreSQL",
  "Redis",
  "Kafka",
  "Distributed Systems",
  "System Design",
  "Architecture",
  "Infrastructure",
  "Algorithms & Data Structures",
  "Engineering Practices",
  "Карьера и интервью",
  "Скрининг",
];
export const statuses = ["To Learn", "Learning", "Practicing", "Understood"];
export const interviewCats = [
  "Coding",
  "Java",
  "Concurrency",
  "SQL",
  "Database Internals",
  "Distributed Systems",
  "System Design",
  "Behavioral Interview",
];
export const stages = ["Idea", "Research", "Draft", "Ready", "Published"];
export const blank = (): Note => ({
  title: "",
  category: "PostgreSQL",
  tags: [],
  sources: [],
  body: "",
  status: "To Learn",
  level: 0,
  practice: "",
  explanation: "",
  prompt: "",
  english: "",
});
export const due = (i: Item) =>
  i.kind === "card" && new Date(i.details.schedule.due).getTime() <= Date.now();
export const date = (s: string) =>
  new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
export { api } from "./client";
