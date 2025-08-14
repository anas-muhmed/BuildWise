"use client";

import React from "react";
import DraggableItem from "./DraggableItem";

const ComponentPallete = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-300 p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Components</h3>

      <div className="space-y-3">
        <DraggableItem id="frontend" label="🖥️ Frontend" color="blue" />
        <DraggableItem id="backend" label="🗄️ Backend" color="green" />
        <DraggableItem id="database" label="💾 Database" color="purple" />
        <DraggableItem id="loadbalancer" label="🌐 Load Balancer" color="yellow" />
        <DraggableItem id="apigateway" label="🛡️ API Gateway" color="indigo" />
      </div>

      {/* Coming Soon */}
      <div className="mt-6">
        <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Coming Soon</h4>
        <div className="space-y-2 text-sm">
          <div className="bg-gray-100 text-gray-400 border border-gray-200 rounded-lg px-4 py-2 opacity-60">
            🧠 Cache
          </div>
          <div className="bg-gray-100 text-gray-400 border border-gray-200 rounded-lg px-4 py-2 opacity-60">
            🔐 Auth
          </div>
          <div className="bg-gray-100 text-gray-400 border border-gray-200 rounded-lg px-4 py-2 opacity-60">
            🗄️ Storage
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPallete;
