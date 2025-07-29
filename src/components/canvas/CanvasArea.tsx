"use client";

import React from "react";
import ComponentPallete from "./ComponentPallete";
import { DndContext } from "@dnd-kit/core"; 

const CanvasArea = () => {
  return (

    <DndContext onDragEnd={(event)=>console.log("dragged:",event)}>
    <div className="flex w-full h-full overflow-hidden bg-neutral-100 p-6 rounded-lg border border-gray-300">
      
      {/* Left sidebar - Component Palette */}
      <ComponentPallete/>
      
       {/* Right side - Canvas workspace */}
  
<div className="w-full h-[calc(100vh-180px)] bg-white rounded-xl border border-dashed border-gray-400 shadow-md">
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-gray-400">
      <div className="text-4xl mb-4">🧱</div>
      <p className="text-lg font-medium">Start Building Your Architecture</p>
      <p className="text-sm mt-2">Drag components from the sidebar to begin</p>
    </div>
  </div>
</div>
    </div>
    </DndContext>
  );
};

export default CanvasArea;

