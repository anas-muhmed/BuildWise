import React from "react";
import CanvasArea from "@/components/canvas/CanvasArea";

const DesignPage = () => {
  return (
    <main className="flex flex-col h-full w-full p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        🧠 Start New Design
      </h1>
      <CanvasArea />
    </main>
  );
};

export default DesignPage;
