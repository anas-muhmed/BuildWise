"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";

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
      className={`absolute group bg-white border rounded-md shadow text-sm font-semibold 
                  flex items-center justify-between
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
        {type.toUpperCase()}
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
        className={`w-4 h-4 mr-2 rounded-full border outline-none
          ${connected ? "bg-blue-600 border-blue-600" :
            isConnectSource ? "bg-blue-600 border-blue-600" :
            "bg-white border-gray-400"}
          focus:ring-2 focus:ring-blue-300`}
        title={isConnectSource ? "Select target…" : "Connect from here"}
      />
    </div>
  );
};

export default DroppedBlock;
