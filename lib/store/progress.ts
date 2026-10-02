"use client";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type Mode = "study" | "revision" | "interview";

export interface QuizResult { best: number; last: number; attempts: number; at: string }
export interface CardState { box: 1 | 2 | 3 | 4 | 5; due: string }

interface ProgressState {
  completedLessons: Record<string, string>;
  quizScores: Record<string, QuizResult>;
  cards: Record<string, CardState>;
  labsSolved: Record<string, string>;
  checklist: Record<string, boolean>;
  mode: Mode;
  toggleLesson: (key: string) => void;
  recordQuiz: (key: string, pct: number) => void;
  rateCard: (id: string, knew: boolean) => void;
  toggleLab: (id: string) => void;
  toggleCheck: (id: string) => void;
  setMode: (m: Mode) => void;
  reset: () => void;
}

/** Storage that never throws: corrupted JSON or blocked storage falls back to defaults. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      if (raw) JSON.parse(raw);
      return raw;
    } catch {
      try { window.localStorage.removeItem(name); } catch { /* ignore */ }
      return null;
    }
  },
  setItem: (name, value) => { try { window.localStorage.setItem(name, value); } catch { /* ignore */ } },
  removeItem: (name) => { try { window.localStorage.removeItem(name); } catch { /* ignore */ } },
};

const initial = {
  completedLessons: {}, quizScores: {}, cards: {}, labsSolved: {}, checklist: {}, mode: "study" as Mode,
};

const DAY_MS = 86_400_000;
const BOX_DAYS = [0, 0, 1, 3, 7, 14];

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,
      toggleLesson: (key) =>
        set((s) => {
          const next = { ...s.completedLessons };
          if (next[key]) delete next[key]; else next[key] = new Date().toISOString();
          return { completedLessons: next };
        }),
      recordQuiz: (key, pct) =>
        set((s) => {
          const prev = s.quizScores[key];
          return { quizScores: { ...s.quizScores, [key]: { best: Math.max(prev?.best ?? 0, pct), last: pct, attempts: (prev?.attempts ?? 0) + 1, at: new Date().toISOString() } } };
        }),
      rateCard: (id, knew) =>
        set((s) => {
          const box = knew ? (Math.min(5, (s.cards[id]?.box ?? 1) + 1) as CardState["box"]) : 1;
          return { cards: { ...s.cards, [id]: { box, due: new Date(Date.now() + BOX_DAYS[box] * DAY_MS).toISOString() } } };
        }),
      toggleLab: (id) =>
        set((s) => {
          const next = { ...s.labsSolved };
          if (next[id]) delete next[id]; else next[id] = new Date().toISOString();
          return { labsSolved: next };
        }),
      toggleCheck: (id) => set((s) => ({ checklist: { ...s.checklist, [id]: !s.checklist[id] } })),
      setMode: (mode) => set({ mode }),
      reset: () => set({ ...initial }),
    }),
    { name: "fsai-progress-v1", version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
