export type StudentStep =
  | "setup"
  | "define"
  | "reasoning"
  | "canvas"
  | "team"
  | "cost"
  | "summary";

export const stepOrder: StudentStep[] = [
  "setup",
  "define",
  "reasoning",
  "canvas",
  "team",
  "cost",
  "summary",
];
