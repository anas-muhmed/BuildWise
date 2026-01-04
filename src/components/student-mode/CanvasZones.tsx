export default function CanvasZones() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* CLIENT */}
      <div
        className="absolute top-0 left-0 h-full border-r border-zinc-800 bg-zinc-950/40"
        style={{ width: "33.33%" }}
      >
        <div className="p-3 text-xs text-zinc-500">CLIENT</div>
      </div>

      {/* SERVER */}
      <div
        className="absolute top-0 left-1/3 h-full border-r border-zinc-800 bg-zinc-950/30"
        style={{ width: "33.33%" }}
      >
        <div className="p-3 text-xs text-zinc-500">SERVER</div>
      </div>

      {/* DATA */}
      <div
        className="absolute top-0 left-2/3 h-full bg-zinc-950/40"
        style={{ width: "33.33%" }}
      >
        <div className="p-3 text-xs text-zinc-500">DATA</div>
      </div>
    </div>
  );
}
