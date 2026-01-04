export type DecisionEffect = {
  addNodes?: Array<{ type: string; label: string }>;
  removeNodes?: string[];
  scoreDelta: number;
  constraintsUnlocked?: string[];
  constraintsLocked?: string[];
  explanation: string;
};

export type DecisionDefinition = {
  id: string;
  label: string;
  effect: DecisionEffect;
};

export type DesignDecision =
  | "ADD_CACHE"
  | "ADD_QUEUE"
  | "USE_MICROSERVICES"
  | "ADD_READ_REPLICA";
