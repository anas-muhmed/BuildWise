export type StudentStep =
  | "setup"
  | "define"
  | "reasoning"
  | "canvas"
  | "team"
  | "cost"
  | "execution"
  | "summary";

export const stepOrder: StudentStep[] = [
  "setup",
  "define",
  "reasoning",
  "canvas",
  "team",
  "cost",
  "execution",
  "summary",
];
