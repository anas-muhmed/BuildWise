import { DecisionState } from "./types";

const decisionStore = new Map<string, DecisionState>();

export function getDecisions(projectId: string): DecisionState {
  return decisionStore.get(projectId) ?? {};
}

export function setDecision(
  projectId: string,
  key: keyof DecisionState,
  value: any
) {
  const existing = decisionStore.get(projectId) ?? {};
  decisionStore.set(projectId, {
    ...existing,
    [key]: value,
  });
}
