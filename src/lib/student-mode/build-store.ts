/**
 * BuildWise — Architecture Build Store
 * Persists the student's component selection to localStorage.
 */

import type { ComponentId } from "./component-catalog";

export type BuildData = {
  selectedIds: ComponentId[];
  score: number;
  savedAt: number;
};

const key = (projectId: string) => `bw-build-${projectId}`;

export function saveBuild(projectId: string, data: BuildData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(projectId), JSON.stringify(data));
  } catch (e) {
    console.warn("build-store: save failed", e);
  }
}

export function loadBuild(projectId: string): BuildData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(projectId));
    return raw ? (JSON.parse(raw) as BuildData) : null;
  } catch {
    return null;
  }
}

export function clearBuild(projectId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(projectId));
}
