"use client";

export default function NodeTooltip({ data }: any) {
  // Clamp tooltip position to stay within viewport
  const left = Math.min(data.x + 260, typeof window !== 'undefined' ? window.innerWidth - 320 : 1000);
  const top = Math.min(data.y, typeof window !== 'undefined' ? window.innerHeight - 220 : 600);

  return (
    <div
      className="absolute z-50 w-72 p-4 rounded-lg
                 bg-zinc-800 border border-zinc-600
                 shadow-xl"
      style={{
        left,
        top,
      }}
    >
      <div className="text-xs text-indigo-400 uppercase mb-1">
        Why this exists
      </div>
      <div className="font-semibold mb-2">
        {data.label}
      </div>
      <div className="text-sm text-zinc-300">
        {data.explanation}
      </div>
    </div>
  );
}
