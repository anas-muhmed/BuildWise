"use client";

export default function CanvasEdges({ graph }: any) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-10">
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#6366f1" />
        </marker>
      </defs>

      {graph.edges.map((edge: any) => {
        const from = graph.nodes.find((n: any) => n.id === edge.from);
        const to = graph.nodes.find((n: any) => n.id === edge.to);

        if (!from || !to) return null;

        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x + 112}
            y1={from.y + 48}
            x2={to.x + 112}
            y2={to.y + 48}
            stroke="#6366f1"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        );
      })}
    </svg>
  );
}
