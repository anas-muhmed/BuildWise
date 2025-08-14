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
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "green":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "purple":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100";
      case "yellow":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "indigo":
        return "bg-indigo-50 border-indigo-200 hover:bg-indigo-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
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
