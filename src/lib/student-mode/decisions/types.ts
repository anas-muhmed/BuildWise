export type BackendDecision = "monolith" | "microservices";

export type DecisionState = {
  backendType?: BackendDecision;
};
