export type ExecutionBlueprint = {
  projectId: string;

  systemOverview: string[];

  components: {
    name: string;
    type: "frontend" | "backend" | "database" | "cache" | "queue";
    responsibilities: string[];
  }[];

  developmentPhases: {
    phase: string;
    tasks: string[];
  }[];

  risks: string[];

  nextSteps: string[];
};
