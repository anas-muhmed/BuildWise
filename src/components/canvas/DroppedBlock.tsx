"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Settings } from "lucide-react";

interface DroppedBlockProps {
  id: string; // instance id
  type: string;
  x: number;
  y: number;
  selected?: boolean;
  onSelect?: (id: string | null) => void;

  // connect
  onBeginConnect?: (id: string) => void;
  onFinishConnect?: (id: string) => void;
  isConnectSource?: boolean; // this block is the selected source?
  hasPendingConnection?: boolean; // ⬅️ NEW: there is some source selected
  isConnecting?: boolean; // Indicates if a connection is in progress
  connected?: boolean; // NEW: is this port connected by any edge?
  
  // configuration
  onOpenConfig?: (id: string) => void; // Open configuration modal
  config?: {
    name?: string;
    tech?: string;
    notes?: string;
    cpu?: string;
    ram?: string;
  };
}

const DroppedBlock = ({
  id,
  type,
  x,
  y,
  selected,
  onSelect,
  onBeginConnect,
  onFinishConnect,
  isConnectSource,
  hasPendingConnection,
  connected,
  onOpenConfig,
  config,
}: DroppedBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type },
  });

  const style: React.CSSProperties = {
    left: x,
    top: y,
    width: 120,
    height: 40,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect?.(id);
      }}
      className={`absolute group bg-white border-2 rounded-lg shadow-md text-sm font-semibold 
                  flex items-center justify-between px-4 py-2
                  ${selected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300 text-gray-700"}`}
    >
      {/* Drag handle — disabled while a connection is pending */}
      <button
        type="button"
        {...(!hasPendingConnection ? { ...listeners, ...attributes } : {})}
        onMouseDown={(e) => e.stopPropagation()}
        className={`h-full px-3 ${hasPendingConnection ? "cursor-default" : "cursor-grab"} rounded-l-md hover:bg-gray-50 select-none`}
        title={hasPendingConnection ? "Connecting…" : "Drag to move"}
      >
        {(config?.name || type).toUpperCase()}
      </button>

      {/* Right-side: gear + port container */}
      <div className="flex items-center gap-2">
        {/* Gear to open modal */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onOpenConfig?.(id); }}
          className="p-1 rounded-md hover:bg-slate-50 text-slate-600"
          title="Configure"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Port: if a source exists → finish; else → begin */}
        <button
          data-port-id={id}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hasPendingConnection) onBeginConnect?.(id);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hasPendingConnection) onFinishConnect?.(id);
          }}
          className={`w-3 h-3 ml-auto rounded-full border-2 outline-none
            ${connected || isConnectSource ? "border-blue-500 bg-blue-500" : "border-blue-500 bg-white hover:bg-blue-500"}
            transition focus:ring-2 focus:ring-blue-300`}
          title={isConnectSource ? "Select target…" : "Connect from here"}
        />
      </div>

      {/* Optional tech stack sublabel */}
      {config?.tech && (
        <div className="absolute -bottom-5 left-0 text-[10px] text-slate-500 max-w-[120px] truncate">
          {config.tech}
        </div>
      )}
    </div>
  );
};

export default DroppedBlock;
