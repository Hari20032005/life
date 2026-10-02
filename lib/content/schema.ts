import { z } from "zod";

export const AiModeSchema = z.enum(["tutor-only", "build-with-ai", "no-ai", "build-day", "mixed", "none"]);
export type AiMode = z.infer<typeof AiModeSchema>;

export const DaySchema = z.object({
  day: z.number().int().min(1).max(7),
  weekday: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  aiMode: AiModeSchema,
  learn: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([]),
  acceptance: z.array(z.string()).default([]),
  brokenLab: z.array(z.string()).default([]),
  /** Day 7 projects reuse the same shape */
  isProjectDay: z.boolean().default(false),
});
export type Day = z.infer<typeof DaySchema>;

export const WeekSchema = z.object({
  week: z.number().int().min(0).max(6),
  title: z.string(),
  tagline: z.string(),
  goal: z.string(),
  audience: z.string().optional(),
  skippable: z.string().optional(),
  outcomes: z.array(z.string()),
  days: z.array(DaySchema),
  project: z.object({
    name: z.string(),
    brief: z.string().optional(),
    requirements: z.array(z.string()),
    stretch: z.array(z.string()).default([]),
    rubric: z.array(z.object({ item: z.string(), points: z.number() })),
  }),
  /** How the evolving booking product looks this week */
  projectStage: z.string(),
});
export type Week = z.infer<typeof WeekSchema>;

export const LessonMetaSchema = z.object({
  title: z.string(),
  day: z.number().int().min(1).max(7),
  order: z.number().int(),
  module: z.string(),
  minutes: z.number().int().positive(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
});
export type LessonMeta = z.infer<typeof LessonMetaSchema> & { slug: string; week: number };

export const QuestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(), type: z.literal("mcq"), topic: z.string(), prompt: z.string(),
    options: z.array(z.string()).min(2), answer: z.number().int(), explanation: z.string(),
  }),
  z.object({
    id: z.string(), type: z.literal("scenario"), topic: z.string(), prompt: z.string(),
    options: z.array(z.string()).min(2), answer: z.number().int(), explanation: z.string(),
  }),
  z.object({
    id: z.string(), type: z.literal("multi"), topic: z.string(), prompt: z.string(),
    options: z.array(z.string()).min(2), answer: z.array(z.number().int()).min(1), explanation: z.string(),
  }),
  z.object({
    id: z.string(), type: z.literal("tf"), topic: z.string(), prompt: z.string(),
    answer: z.boolean(), explanation: z.string(),
  }),
]);
export type Question = z.infer<typeof QuestionSchema>;

export const QuizSchema = z.object({ title: z.string(), passMark: z.number().default(70), questions: z.array(QuestionSchema).min(1) });
export type Quiz = z.infer<typeof QuizSchema>;

export const InterviewItemSchema = z.object({
  id: z.string(),
  level: z.enum(["junior", "mid", "senior"]),
  kind: z.enum(["concept", "debugging", "system-design", "ai-engineering", "behavioural"]).default("concept"),
  q: z.string(),
  a: z.string(),
  followUps: z.array(z.string()).default([]),
});
export type InterviewItem = z.infer<typeof InterviewItemSchema>;

export const FlashcardSchema = z.object({ id: z.string(), front: z.string(), back: z.string(), topic: z.string() });
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const LabSchema = z.object({
  id: z.string(),
  title: z.string(),
  symptom: z.string(),
  hints: z.array(z.string()).default([]),
  cause: z.string(),
  fix: z.string(),
  verify: z.string(),
  code: z.string().optional(),
  lang: z.string().optional(),
});
export type Lab = z.infer<typeof LabSchema>;

export const PromptKinds = [
  "tutor", "claude", "chatgpt", "debugging", "code-review", "architecture-review", "pr-review", "learning", "interview",
] as const;
export const PromptSchema = z.object({
  kind: z.enum(PromptKinds),
  title: z.string(),
  when: z.string(),
  prompt: z.string(),
});
export type PromptItem = z.infer<typeof PromptSchema>;

export const AssessmentSchema = z.object({
  title: z.string(),
  durationMinutes: z.number(),
  rules: z.array(z.string()),
  parts: z.array(z.object({ title: z.string(), points: z.number(), tasks: z.array(z.string()) })),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export const ResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  why: z.string(),
  kind: z.enum(["reference", "course", "book", "tool", "spec", "pricing"]),
});
export type Resource = z.infer<typeof ResourceSchema>;
