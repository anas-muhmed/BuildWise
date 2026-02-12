"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";

interface DraggableItemProps {
  label: string;
  id: string;
  color: string;
}

const DraggableItem = ({ label, id, color }: DraggableItemProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { type: id },
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: transform ? 1000 : "auto",
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 text-blue-300";
      case "green":
        return "bg-green-500/20 border-green-500/50 hover:bg-green-500/30 text-green-300";
      case "purple":
        return "bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-300";
      case "yellow":
        return "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-300";
      case "indigo":
        return "bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30 text-indigo-300";
      default:
        return "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300";
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`p-3 ${getColorClasses(
        color
      )} rounded-lg cursor-grab border font-semibold`}
    >
      {label}
    </div>
  );
};

export default DraggableItem;
