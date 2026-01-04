export type SavedDesign = {
  id: string;
  projectId: string;
  timestamp: number;
  base: {
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ from: string; to: string; type: string }>;
  };
  decisions: string[];
  score: number;
};
