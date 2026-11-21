import { z } from "zod";
const txt = z.string().max(200000),
  name = z.string().trim().min(1).max(350),
  key = z
    .string()
    .min(1)
    .max(200)
    .regex(/^[\w.-]+$/),
  time = z.string().datetime();
const web = z
  .string()
  .max(4096)
  .url()
  .regex(/^https?:\/\//i);
export const statuses = ["To Learn", "Learning", "Practicing", "Understood"];
export const noteFields = z.object({
  title: name,
  category: name,
  origin: z.string().max(1200).default(""),
  tags: z.array(name).max(80).default([]),
  sources: z.array(web).max(300).default([]),
  body: txt.default(""),
  status: z.enum(statuses).default("To Learn"),
  level: z.number().int().min(0).max(5).default(0),
  practice: txt.default(""),
  explanation: txt.default(""),
  prompt: txt.default(""),
  english: txt.default(""),
});
const schedule = z.object({
  due: time,
  stability: z.number().nonnegative(),
  difficulty: z.number().nonnegative(),
  scheduled_days: z.number(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  learning_steps: z.number().int(),
  state: z.number().int().min(0).max(3),
  last_review: time.optional(),
});
export const itemFields = z.object({
  title: name,
  kind: z.enum(["question", "card", "lab", "english", "post", "task"]),
  note: key.nullable().default(null),
  details: z
    .object({
      answer: txt.default(""),
      english: txt.default(""),
      category: txt.default(""),
      gap: txt.default(""),
      score: z.array(z.number().int().min(0).max(2)).length(3).optional(),
      stage: z
        .enum(["Idea", "Research", "Draft", "Ready", "Published"])
        .default("Idea"),
      short: txt.default(""),
      date: z.string().max(32).default(""),
      format: txt.default(""),
      done: z.boolean().default(false),
      attempt: txt.default(""),
      sources: z.array(web).max(300).default([]),
      schedule: schedule.optional(),
    })
    .default({}),
});
export const topicFields = z.object({
  id: key,
  area: name,
  section: name,
  subsection: name,
  title: name,
  difficulty: z.enum(["Middle", "Senior"]),
  theory: txt.min(1),
  skills: z
    .array(z.object({ id: key, text: name }))
    .min(1)
    .max(100)
    .refine((a) => new Set(a.map((v) => v.id)).size === a.length),
  question: txt.min(1),
  answer: txt.min(1),
  criteria: z.array(name).min(1),
  sources: z.array(web),
  custom: z.boolean().default(false),
  hidden: z.boolean().default(false),
  edited: z.boolean().default(false),
});
export const flags = [
  "unstarted",
  "learning",
  "theory",
  "explain",
  "practice",
  "english",
];
export const mark = z.object({
  id: key,
  topic: key,
  skill: key,
  flags: z.array(z.enum(flags)).max(6),
  repeat: z.boolean(),
  checked: time.nullable(),
  updated: time,
});
export const schemas = {
  notes: noteFields.extend({ id: key, created: time, updated: time }),
  items: itemFields
    .extend({ id: key, updated: time })
    .refine((i) => i.kind !== "card" || i.details.schedule),
  links: z
    .object({ id: key, source: key, target: key, label: name })
    .refine((l) => l.source !== l.target),
  revisions: z.object({ id: key, note: key, snapshot: txt, created: time }),
  reviews: z.object({
    id: key,
    card: key,
    rating: z.number().int().min(1).max(4),
    created: time,
  }),
  assets: z.object({
    id: key,
    mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
    base64: z.string().max(7000000),
  }),
  topics: topicFields,
  marks: mark,
  exams: z.object({
    id: key,
    topic: key,
    question: txt,
    response: txt.min(1),
    answer: txt,
    result: z.enum(["correct", "partial", "miss"]),
    created: time,
  }),
  events: z.object({
    id: key,
    created: time,
    mastered: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  topicNotes: z.object({ id: key, topic: key, note: key }),
};
export const tableNames = Object.keys(schemas);
export function validateImage(bytes) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw Error("Изображение должно быть меньше 5 МБ");
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n))
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  throw Error("Поддерживаются PNG, JPEG и WebP");
}
export function mastery(topics, marks) {
  const map = new Map(marks.map((m) => [m.topic + "/" + m.skill, m]));
  const visible = topics.filter((t) => !t.hidden);
  let mastered = 0,
    unchecked = 0,
    totalSkills = 0;
  for (const t of visible) {
    let complete = true;
    for (const sk of t.skills) {
      const m = map.get(t.id + "/" + sk.id);
      totalSkills++;
      if (!m?.checked) unchecked++;
      if (!m?.flags.includes("explain") || !m.flags.includes("practice"))
        complete = false;
    }
    if (complete) mastered++;
  }
  return {
    mastered,
    total: visible.length,
    unchecked,
    totalSkills,
    percent: visible.length ? Math.round((100 * mastered) / visible.length) : 0,
  };
}
