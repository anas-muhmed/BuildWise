export type CanvasNode = {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
};

export type CanvasEdge = {
  from: string;
  to: string;
  label?: string;
};

export type CanvasGraph = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};
