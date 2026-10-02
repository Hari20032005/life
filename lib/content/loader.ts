import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { z } from "zod";
import {
  WeekSchema, LessonMetaSchema, QuizSchema, InterviewItemSchema, FlashcardSchema, LabSchema, PromptSchema, AssessmentSchema, ResourceSchema,
  type Week, type LessonMeta, type Quiz, type InterviewItem, type Flashcard, type Lab, type PromptItem, type Assessment, type Resource,
} from "./schema";

const ROOT = path.join(process.cwd(), "content");
export const WEEK_NUMBERS = [0, 1, 2, 3, 4, 5, 6] as const;

const weekDir = (n: number) => path.join(ROOT, "weeks", `week-${n}`);

function readJson<T>(file: string, schema: z.ZodType<T>): T | null {
  if (!fs.existsSync(file)) return null;
  const parsed = schema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`Invalid content file ${path.relative(ROOT, file)}:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const getWeek = cache((n: number): Week | null => readJson(path.join(weekDir(n), "week.json"), WeekSchema));
export const getWeeks = cache((): Week[] => WEEK_NUMBERS.map((n) => getWeek(n)).filter((w): w is Week => !!w));

export const getLessons = cache((n: number): LessonMeta[] => {
  const dir = path.join(weekDir(n), "lessons");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      const meta = LessonMetaSchema.safeParse(data);
      if (!meta.success) throw new Error(`Invalid frontmatter in week-${n}/lessons/${f}:\n${z.prettifyError(meta.error)}`);
      return { ...meta.data, slug: f.replace(/\.mdx$/, ""), week: n };
    })
    .sort((a, b) => a.day - b.day || a.order - b.order);
});

export const getLesson = cache((n: number, slug: string) => {
  const file = path.join(weekDir(n), "lessons", `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const { content } = matter(fs.readFileSync(file, "utf8"));
  const meta = getLessons(n).find((l) => l.slug === slug);
  return meta ? { meta, body: content } : null;
});

/** Flat, ordered list of every lesson in the program, used for prev/next + progress totals. */
export const getAllLessons = cache((): LessonMeta[] => WEEK_NUMBERS.flatMap((n) => getLessons(n)));

export const getQuiz = cache((n: number): Quiz | null => readJson(path.join(weekDir(n), "quiz.json"), QuizSchema));
export const getInterview = cache((n: number): InterviewItem[] => readJson(path.join(weekDir(n), "interview.json"), z.array(InterviewItemSchema)) ?? []);
export const getFlashcards = cache((n: number): Flashcard[] => readJson(path.join(weekDir(n), "flashcards.json"), z.array(FlashcardSchema)) ?? []);
export const getLabs = cache((n: number): Lab[] => readJson(path.join(weekDir(n), "labs.json"), z.array(LabSchema)) ?? []);
export const getPrompts = cache((n: number): PromptItem[] => readJson(path.join(weekDir(n), "prompts.json"), z.array(PromptSchema)) ?? []);
export const getResources = cache((n: number): Resource[] => readJson(path.join(weekDir(n), "resources.json"), z.array(ResourceSchema)) ?? []);
export const getAssessment = cache((n: number): Assessment | null => readJson(path.join(weekDir(n), "assessment.json"), AssessmentSchema));

export const getMarkdown = cache((n: number, name: "cheatsheet" | "revision"): string | null => {
  const file = path.join(weekDir(n), `${name}.mdx`);
  return fs.existsSync(file) ? matter(fs.readFileSync(file, "utf8")).content : null;
});

export const getProgramAssessments = cache((): Assessment[] => {
  const dir = path.join(ROOT, "assessments");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => readJson(path.join(dir, f), AssessmentSchema)!)
});

export function getAdjacentLessons(week: number, slug: string) {
  const all = getAllLessons();
  const i = all.findIndex((l) => l.week === week && l.slug === slug);
  return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

export const lessonKey = (l: { week: number; slug: string }) => `w${l.week}/${l.slug}`;

export function extractHeadings(body: string) {
  const out: { depth: 2 | 3; text: string; id: string }[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) out.push({ depth: m[1].length as 2 | 3, text: m[2], id: slugify(m[2]) });
  }
  return out;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
