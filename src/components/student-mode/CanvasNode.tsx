"use client";

export default function CanvasNode({ node, onHover, isHovered }: any) {
  return (
    <div
      className={`absolute w-56 p-4 rounded-lg transition z-20 ${
        isHovered
          ? "bg-zinc-800 border-indigo-500 shadow-lg"
          : "bg-zinc-900 border-zinc-700"
      } border`}
      style={{
        left: node.x,
        top: node.y,
      }}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover({
          ...node,
          x: rect.right + 12,
          y: rect.top,
        });
      }}
      onMouseLeave={() => onHover(null)}
    >
      <div className="text-xs uppercase text-zinc-400">
        {node.type}
      </div>
      <div className="text-lg font-semibold">
        {node.label}
      </div>
    </div>
  );
}
