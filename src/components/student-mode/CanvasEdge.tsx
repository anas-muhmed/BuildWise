type Props = {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
};

export default function CanvasEdge({ from, to }: Props) {
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height / 2;
  const x2 = to.x + to.width / 2;
  const y2 = to.y + to.height / 2;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#52525b"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />

      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#52525b" />
        </marker>
      </defs>
    </svg>
  );
}
