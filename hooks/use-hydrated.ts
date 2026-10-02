"use client";
import { useEffect, useState } from "react";

/** Returns false during SSR + first client render so persisted state never causes hydration mismatches. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
