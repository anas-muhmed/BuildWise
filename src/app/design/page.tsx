"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import ConfigModal from "@/components/canvas/ConfigModal";
import AiDrawer from "@/components/AiDrawer";

const STORAGE_KEY = "bw:v1:design";

type DesignState = {
  droppedComponents: {
    id: string;
    type: string;
    x: number;
    y: number;
    config?: {
      name?: string;
      tech?: string;
      notes?: string;
      cpu?: string;
      ram?: string;
    };
  }[];
  edges: { id: string; fromId: string; toId: string }[];
  viewport?: { x: number; y: number; zoom: number }; // For later use
};

// Helper function to prevent too many saves happening at once
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms = 400) {
  let t: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

interface DroppedComponent {
  id: string; // instance id
  type: string; // palette type
  x: number;
  y: number;
  config?: {
    name?: string;
    tech?: string;
    notes?: string;
    cpu?: string;
    ram?: string;
  };
}
type Edge = { id: string; fromId: string; toId: string };

export default function DesignPage() {
  // render only after mount to avoid hydration mismatch from dnd-kit/ids
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(useSensor(PointerSensor));

  const [droppedComponents, setDroppedComponents] = useState<
    DroppedComponent[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true); //Auto-Save toggle

  // AI functionality state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const aiDrawerRef = useRef<{ analyze: () => void } | null>(null);

  // overlay + precise pointer
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // connections
  const [edges, setEdges] = useState<Edge[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [preview, setPreview] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  //save current design to localstorage
  const saveNow = React.useCallback(() => {
    const payload = {
      meta: {
        version: "1.0",
        savedAt: new Date().toISOString(), // current time
      },
      droppedComponents,
      edges,
      // viewport (later)
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.log("Design saved at", payload.meta.savedAt);
    } catch (err) {
      console.error("failed to save:", err);
    }
  }, [droppedComponents, edges]);

  //debounced autosave
  const debouncedSave = React.useMemo(() => debounce(saveNow, 500), [saveNow]);

  //load last saved design
  const loadNow = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log("no saved design found");
        return;
      }
      const parsed: DesignState = JSON.parse(raw);
      setDroppedComponents(parsed.droppedComponents ?? []);
      setEdges(parsed.edges ?? []);
      setSelectedId(null);
      console.log("Design loaded");
    } catch (err) {
      console.error("failed to load:", err);
    }
  }, []);

  // Helper functions for AI Drawer
  const getCanvasJson = () => {
    return { droppedComponents, edges };
  };

  const onAddSuggestion = (suggestion: { action: string; title: string; description: string }) => {
    // Add logic to apply suggestion to canvas
    console.log("Adding suggestion to canvas:", suggestion);
    // For now, just close the drawer
    setIsAiDrawerOpen(false);
  };

  // Configuration modal state
  const [editId, setEditId] = useState<string | null>(null);
  const editingBlock = useMemo(
    () => droppedComponents.find((b) => b.id === editId) || null,
    [editId, droppedComponents]
  );

  //New(clear canvas)
  const newCanvas = React.useCallback(() => {
    setDroppedComponents([]);
    setEdges([]);
    setSelectedId(null);
    console.log("Canvas Cleared");
  }, []);

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
        setDroppedComponents((prev) => prev.filter((b) => b.id !== selectedId));
        setEdges((prev) =>
          prev.filter(
            (ed) => ed.fromId !== selectedId && ed.toId !== selectedId
          )
        );
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

    const canvas = document.querySelector(
      '[data-canvas="true"]'
    ) as HTMLElement;
    if (!canvas) return;

    // pointer-relative, centered, snapped (mousePos is already canvas-relative)
    let dropX = mousePos.x - 60;
    let dropY = mousePos.y - 25;
    dropX = Math.round(dropX / 20) * 20;
    dropY = Math.round(dropY / 20) * 20;
    dropX = Math.max(5, dropX);
    dropY = Math.max(5, dropY);

    // move existing instance if ids match
    const idx = droppedComponents.findIndex((c) => c.id === String(active.id));
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
    setDroppedComponents((prev) => [...prev, newBlock]);
  };

  const getPortCenterCanvas = (id: string) => {
    const el = canvasRef.current?.querySelector(
      `[data-port-id="${id}"]`
    ) as HTMLElement | null;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!el || !rect) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: r.left - rect.left + r.width / 2,
      y: r.top - rect.top + r.height / 2,
    };
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
    setEdges((prev) => [...prev, { id, fromId: connectFrom, toId }]);
    setIsConnecting(false);
    setConnectFrom(null);
  };

  const cancelConnect = () => {
    setIsConnecting(false);
    setConnectFrom(null);
  };

  // Configuration functions
  const openConfig = (id: string) => setEditId(id);
  const closeConfig = () => setEditId(null);

  const saveConfig = (data: DroppedComponent["config"]) => {
    if (!editId) return;
    setDroppedComponents((prev) =>
      prev.map((b) =>
        b.id === editId ? { ...b, config: { ...b.config, ...data } } : b
      )
    );
    setEditId(null);
  };

  //Load once on mount(if something exist)
  useEffect(() => {
    if (!mounted) return;
    loadNow();
  }, [mounted, loadNow]);

  useEffect(() => {
    if (!mounted || !autoSave) return;
    debouncedSave();
  }, [mounted, autoSave, droppedComponents, edges, debouncedSave]);

  if (!mounted) {
    return (
      <main className="flex items-center justify-center h-[80vh]">
        <div className="text-gray-500">Loading canvas…</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          🧠 Start New Design
        </h1>

        {/* Enhanced Toolbar */}
        <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={saveNow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              💾 Save
            </button>
            <button
              onClick={loadNow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              📂 Load
            </button>
            <button
              onClick={newCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              ✨ New
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200"></div>

          {/* Auto-save Toggle */}
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  autoSave ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                    autoSave ? "translate-x-5" : "translate-x-0.5"
                  } mt-0.5`}
                ></div>
              </div>
            </div>
            Auto-save
          </label>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200"></div>

          {/* AI Analysis Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAiDrawerOpen(true);
                // Trigger analysis when drawer opens
                setTimeout(() => {
                  aiDrawerRef.current?.analyze();
                }, 100);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm bg-purple-600 text-white hover:bg-purple-700"
            >
              🤖 AI Analysis
            </button>
          </div>

          {/* Import/Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const payload: DesignState = { droppedComponents, edges };
                const blob = new Blob([JSON.stringify(payload, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "buildwise-design.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              📤 Export
            </button>

            <label className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer">
              📥 Import
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const parsed: DesignState = JSON.parse(text);
                    setDroppedComponents(parsed.droppedComponents ?? []);
                    setEdges(parsed.edges ?? []);
                    setSelectedId(null);
                    console.log("Design imported from JSON");
                  } catch (err) {
                    console.error("Failed to import JSON:", err);
                  } finally {
                    e.currentTarget.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* AI Drawer */}
      <AiDrawer
        ref={aiDrawerRef}
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onAddSuggestion={onAddSuggestion}
        getCanvasJson={getCanvasJson}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
            onOpenConfig={openConfig}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="px-4 py-2 bg-white border rounded-md shadow text-sm font-semibold text-gray-700 text-center">
              <div className="text-base font-semibold uppercase">
                {droppedComponents.find((block) => block.id === activeId)
                  ?.config?.name || activeId.split("-")[0].toUpperCase()}
              </div>
              {droppedComponents.find((block) => block.id === activeId)?.config
                ?.tech && (
                <div className="text-xs text-gray-500 italic mt-0.5">
                  {
                    droppedComponents.find((block) => block.id === activeId)
                      ?.config?.tech
                  }
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Configuration Modal */}
      <ConfigModal
        open={!!editId}
        onOpenChange={(v) => (v ? null : closeConfig())}
        initial={editingBlock?.config}
        onSave={saveConfig}
        blockTitle={editingBlock?.type}
      />
    </main>
  );
}
