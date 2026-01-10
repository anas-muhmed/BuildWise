export type StudentStep =
  | "setup"
  | "define"
  | "reasoning"
  | "canvas"
  | "team"
  | "cost"
  | "summary"
  | "execution";

export const stepOrder: StudentStep[] = [
  "setup",
  "define",
  "reasoning",
  "canvas",
  "team",
  "cost",
  "summary",
  "execution",
];
