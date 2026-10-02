/* Validates every content file against its Zod schema and lesson quality rules. Run: npm run content:check */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { WeekSchema, LessonMetaSchema, QuizSchema, InterviewItemSchema, FlashcardSchema, LabSchema, PromptSchema, AssessmentSchema } from "../lib/content/schema";

const root = path.join(process.cwd(), "content");
let errors = 0;
const fail = (msg: string) => { errors++; console.error("✗", msg); };

function json<T>(file: string, schema: z.ZodType<T>) {
  if (!fs.existsSync(file)) return;
  const r = schema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!r.success) fail(`${path.relative(root, file)}\n${z.prettifyError(r.error)}`);
  return r.success ? r.data : undefined;
}

const REQUIRED_HEADINGS = ["## What", "## Why", "## How", "## When", "## Where", "Common mistakes", "Industry"];

for (const n of [0, 1, 2, 3, 4, 5, 6]) {
  const dir = path.join(root, "weeks", `week-${n}`);
  if (!fs.existsSync(path.join(dir, "week.json"))) { fail(`week-${n}/week.json missing`); continue; }
  json(path.join(dir, "week.json"), WeekSchema);
  json(path.join(dir, "quiz.json"), QuizSchema);
  json(path.join(dir, "interview.json"), z.array(InterviewItemSchema));
  json(path.join(dir, "flashcards.json"), z.array(FlashcardSchema));
  json(path.join(dir, "labs.json"), z.array(LabSchema));
  json(path.join(dir, "prompts.json"), z.array(PromptSchema));
  json(path.join(dir, "assessment.json"), AssessmentSchema);

  const ld = path.join(dir, "lessons");
  if (fs.existsSync(ld)) {
    for (const f of fs.readdirSync(ld).filter((x) => x.endsWith(".mdx"))) {
      const { data, content } = matter(fs.readFileSync(path.join(ld, f), "utf8"));
      const m = LessonMetaSchema.safeParse(data);
      if (!m.success) fail(`week-${n}/lessons/${f}\n${z.prettifyError(m.error)}`);
      for (const h of REQUIRED_HEADINGS) if (!content.includes(h)) fail(`week-${n}/lessons/${f} is missing section "${h}"`);
      if (!content.includes("<Levels>")) fail(`week-${n}/lessons/${f} is missing the four <Levels>`);
    }
  }
}
if (errors) { console.error(`\n${errors} content problem(s)`); process.exit(1); }
console.log("✓ content OK");
