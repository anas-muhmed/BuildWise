"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import ComponentPallete from "@/components/canvas/ComponentPallete";
import CanvasArea from "@/components/canvas/CanvasArea";

interface DroppedComponent {
  id: string;   // instance id
  type: string; // palette type
  x: number;
  y: number;
}
type Edge = { id: string; fromId: string; toId: string };

export default function DesignPage() {
  // render only after mount to avoid hydration mismatch from dnd-kit/ids
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(useSensor(PointerSensor));

  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // overlay + precise pointer
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // connections
  const [edges, setEdges] = useState<Edge[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [preview, setPreview] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // track mouse while dragging (precise drop)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (isConnecting) setPreview({ x: cx, y: cy });
      if (isDragging) setMousePos({ x: cx, y: cy });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isConnecting, isDragging]);

  // keyboard delete for selected block (also remove attached edges)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setDroppedComponents(prev => prev.filter(b => b.id !== selectedId));
        setEdges(prev => prev.filter(ed => ed.fromId !== selectedId && ed.toId !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id)); // palette type OR instance id
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || over.id !== "canvas-dropzone") return;

    const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement;
    if (!canvas) return;

    // pointer-relative, centered, snapped (mousePos is already canvas-relative)
    let dropX = mousePos.x - 60;
    let dropY = mousePos.y - 25;
    dropX = Math.round(dropX / 20) * 20;
    dropY = Math.round(dropY / 20) * 20;
    dropX = Math.max(5, dropX);
    dropY = Math.max(5, dropY);

    // move existing instance if ids match
    const idx = droppedComponents.findIndex(c => c.id === String(active.id));
    if (idx >= 0) {
      const updated = [...droppedComponents];
      updated[idx] = { ...updated[idx], x: dropX, y: dropY };
      setDroppedComponents(updated);
      return;
    }

    // add new instance from palette
    const type = String(active.id);
    const newBlock: DroppedComponent = {
      id: `${type}-${Date.now()}`,
      type,
      x: dropX,
      y: dropY,
    };
    setDroppedComponents(prev => [...prev, newBlock]);
  };

  const getPortCenterCanvas = (id: string) => {
    const el = canvasRef.current?.querySelector(`[data-port-id="${id}"]`) as HTMLElement | null;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!el || !rect) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
  };

  const beginConnect = (fromId: string) => {
    setConnectFrom(fromId);
    setIsConnecting(true);
    setPreview(getPortCenterCanvas(fromId));
  };

  const finishConnect = (toId: string) => {
    if (!connectFrom || connectFrom === toId) {
      setIsConnecting(false);
      setConnectFrom(null);
      return;
    }
    const id = `${connectFrom}->${toId}-${Date.now()}`;
    setEdges(prev => [...prev, { id, fromId: connectFrom, toId }]);
    setIsConnecting(false);
    setConnectFrom(null);
  };

  const cancelConnect = () => {
    setIsConnecting(false);
    setConnectFrom(null);
  };

  if (!mounted) {
    return (
      <main className="flex items-center justify-center h-[80vh]">
        <div className="text-gray-500">Loading canvas…</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">🧠 Start New Design</h1>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex w-full h-full">
          <ComponentPallete />
          <CanvasArea
            droppedComponents={droppedComponents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            edges={edges}
            connectFrom={connectFrom}
            isConnecting={isConnecting}
            preview={preview}
            onBeginConnect={beginConnect}
            onFinishConnect={finishConnect}
            onCancelConnect={cancelConnect}
            dragPointer={isDragging ? mousePos : undefined}
            canvasRef={canvasRef}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="px-4 py-2 bg-white border rounded-md shadow text-sm font-semibold text-gray-700 z-[9999]">
              {activeId.split("-")[0].toUpperCase()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}
