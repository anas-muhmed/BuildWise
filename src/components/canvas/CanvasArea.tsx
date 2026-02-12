"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DroppedBlock from "./DroppedBlock";
import { getEdgeColor } from "@/lib/helpers";

interface DroppedComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  config?: {
    name?: string;
    tech?: string;
    notes?: string;
    cpu?: string;
    ram?: string;
  };
}

type Edge = { id: string; fromId: string; toId: string };

interface CanvasAreaProps {
  droppedComponents: DroppedComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  edges: Edge[];
  connectFrom: string | null;
  isConnecting: boolean;
  preview: { x: number; y: number };
  onBeginConnect: (id: string) => void;
  onFinishConnect: (id: string) => void;
  onCancelConnect: () => void;
  dragPointer?: { x: number; y: number };
  canvasRef: React.RefObject<HTMLDivElement | null>; // Allow null
  onOpenConfig: (id: string) => void; // Add config modal opener
}

const CanvasArea = ({
  droppedComponents,
  selectedId,
  onSelect,
  edges,
  connectFrom,
  isConnecting,
  preview,
  onBeginConnect,
  onFinishConnect,
  onCancelConnect,
  dragPointer,
  canvasRef,
  onOpenConfig,
}: CanvasAreaProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-dropzone" });

  // Using a straight line instead of a curve
  const straightLine = (a:{x:number,y:number}, b:{x:number,y:number}) => {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  };
  

  const [selectedEdge,setSelectedEdge]=React.useState<string|null>(null);
  // --- PAN STATE ---
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStart = React.useRef<{ x: number; y: number } | null>(null);

  // Global listeners
  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isPanning || !panStart.current) return;
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    };

    const handleUp = () => setIsPanning(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning]); // 🚨 only depend on isPanning

  // Get canvas bounding rect
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();

  // Get port center position
  const portCenter = (id: string) => {
    if (!canvasRef.current) return { x: 0, y: 0 }; // Guard for undefined canvasRef.current
    const port = canvasRef.current.querySelector(`[data-port-id="${id}"]`) as HTMLElement | null;
    const cr = getCanvasRect();
    if (!port || !cr) return { x: 0, y: 0 };
    const pr = port.getBoundingClientRect();
    return { x: pr.left - cr.left + pr.width / 2, y: pr.top - cr.top + pr.height / 2 };
  };

  // preview is already in canvas coords
  const previewPoint = () => ({ x: preview.x, y: preview.y });
  
  const isNearTarget = () => {
    if (!connectFrom || !canvasRef.current) return false;
    const b = previewPoint();
    // 14px radius snap to any port except source
    const ports = Array.from((canvasRef.current).querySelectorAll("[data-port-id]")) as HTMLElement[];
    return ports.some(p => {
      const id = p.getAttribute("data-port-id");
      if (id === connectFrom) return false;
      const r = p.getBoundingClientRect();
      const cr = canvasRef.current!.getBoundingClientRect();
      const cx = r.left - cr.left + r.width/2;
      const cy = r.top - cr.top + r.height/2;
      return Math.hypot(cx - b.x, cy - b.y) < 14;
    });
  };

  return (
    <div
      id="canvas-dropzone"
      ref={node => {
        setNodeRef(node);
        if (canvasRef) {
          canvasRef.current = node || null; // Explicitly handle null
        }
      }}
      data-canvas="true"
      className={`relative flex-1 h-[calc(100vh-180px)] bg-zinc-950 rounded-2xl
        border ${isOver ? "border-purple-500 bg-purple-950/20" : "border-dashed border-zinc-700"} shadow-sm`}
      style={{
        backgroundImage: isOver
          ? "none"
          : "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (isConnecting) {
            onCancelConnect();
          } else {
            onSelect(null);
            setSelectedEdge(null);

            // 👇 Start panning with left mouse button
            if (e.button === 0) {
              setIsPanning(true);
              panStart.current = {
                x: e.clientX - pan.x,
                y: e.clientY - pan.y,
              };
            }
          }
        }
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isPanning ? "none" : "transform 0.05s linear",
        }}
      >
        {/* Blocks layer (z-10) */}
        <div className="absolute inset-0 z-10">
          {droppedComponents.map((c) => {
            const connected = edges.some(e => e.fromId === c.id || e.toId === c.id);
            return (
              <DroppedBlock
                key={c.id}
                id={c.id}
                type={c.type}
                x={c.x}
                y={c.y}
                selected={selectedId === c.id}
                onSelect={onSelect}
                onBeginConnect={onBeginConnect}
                onFinishConnect={onFinishConnect}
                isConnectSource={connectFrom === c.id}
                hasPendingConnection={!!connectFrom}
                isConnecting={isConnecting}
                connected={connected}
                onOpenConfig={onOpenConfig}
                config={c.config}
              />
            );
          })}
        </div>

        {/* SVG edges ABOVE blocks (z-20) */}
        <svg
          className="absolute inset-0 z-20 pointer-events-none"
          width="100%"               
          height="100%"              
          preserveAspectRatio="none" 
          style={{ overflow: "visible" }}
          data-dx={dragPointer?.x ?? 0}
          data-dy={dragPointer?.y ?? 0}
        >
          {/* We'll create markers dynamically for each edge */}
          {/* DEBUG: show port centers */}
          {droppedComponents.map((c) => {
            const p = portCenter(c.id);
            return <circle key={`dbg-${c.id}`} cx={p.x} cy={p.y} r={2.5} fill="#ef4444" />;
          })}
          
          {/* Center cache for performance */}
          {(() => {
            const centerCache = new Map<string, {x: number, y: number}>();
            const center = (id: string) => {
              if (!centerCache.has(id)) centerCache.set(id, portCenter(id));
              return centerCache.get(id)!;
            };
            
            return (
              <>
                {edges.map((e) => {
                  const a = center(e.fromId);
                  const b = center(e.toId);
                  
                  // Find source block to determine color
                  const sourceBlock = droppedComponents.find(c => c.id === e.fromId);
                  const color = sourceBlock ? getEdgeColor(sourceBlock.type) : "#4b5563";
                  
                  const isSelected=selectedEdge===e.id;


                  // Create a marker with the correct color
                  const markerId = `arrow-${sourceBlock?.type || "default"}`;
                  
                  return (
                    <React.Fragment key={e.id}>
                      <defs>
                        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" 
                                markerWidth="5" markerHeight="5" orient="auto">
                          <path d="M0,0 L10,5 L0,10 Z" fill={color} />
                        </marker>
                      </defs>
                      <path
                        d={straightLine(a, b)}
                        stroke={isSelected?"#2563eb":color}
                        strokeWidth={isSelected?"3":"2"}
                        fill="none"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        markerEnd={`url(#${markerId})`}
                        className="cursor-pointer"
                        onClick={()=>setSelectedEdge(e.id)}
                        style={{pointerEvents:"all"}}
                      />
                    </React.Fragment>
                  );
                })}
                
                {/* rubber-band preview */}
                {isConnecting && connectFrom && (() => {
                  const a = center(connectFrom);
                  const b = previewPoint();
                  const willSnap = isNearTarget();
                  
                  // Find source block to determine color
                  const sourceBlock = droppedComponents.find(c => c.id === connectFrom);
                  const baseColor = sourceBlock ? getEdgeColor(sourceBlock.type) : "#4b5563";
                  const color = willSnap ? baseColor : "#64748b";
                  
                  return (
                    <path 
                      d={straightLine(a, b)}
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      fill="none" 
                      strokeLinecap="round" 
                      vectorEffect="non-scaling-stroke" 
                    />
                  );
                })()}
              </>
            );
          })()}
        </svg>
      </div>

      {droppedComponents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-500">
            <div className="text-4xl mb-4">🧱</div>
            <p className="text-lg font-medium text-zinc-400">Start Building Your Architecture</p>
            <p className="text-sm mt-2">Drag components from the sidebar to begin</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasArea;
