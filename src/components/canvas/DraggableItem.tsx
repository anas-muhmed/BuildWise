// components/canvas/DraggableItem.tsx
"use client"

import React from "react";
import { useDraggable } from "@dnd-kit/core";


interface DraggableItemProps{
    label:string;
    id:string;
    color:string;
}

const DraggableItem=({label,id,color}:DraggableItemProps)=>{

    const{attributes,listeners,setNodeRef,transform}=useDraggable({
        id:id,
    })

    const style = {
  transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
};
    return(


        <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
       className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg cursor-grab hover:bg-${color}-100`}>

            {label}
        </div>
    )
};

export default DraggableItem;