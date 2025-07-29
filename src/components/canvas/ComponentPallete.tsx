"use client"

import React from "react";
import DraggableItem from "./DraggableItem";

const ComponentPallete=()=>{
    return(
        <div className="w-64 bg-white border-r border-gray-300 p-4">
           <h3 className="text-lg font-bold mb-4 text-gray-800">
        Components
      </h3>

      <div className="space-y-3">
  
   <DraggableItem id="frontend" label="🖥️ Frontend" color="blue" />
  <DraggableItem id="backend" label="🗄️ Backend" color="green"/>
  <DraggableItem id="database" label="💾 Database" color="purple" />
  <DraggableItem id="loadbalancer" label="🌐 Load Balancer" color="yellow" />
  

</div>

        </div>
    )
}
export default ComponentPallete;