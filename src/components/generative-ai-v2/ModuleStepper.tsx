"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import clsx from "clsx";
import { CheckCircle, Clock, GripVertical, Info } from "lucide-react";

/**
 * ModuleStepper
 *
 * Props:
 * - modules: Module[] (from backend)
 * - currentIndex: number
 * - onSelectModule(index:number)
 * - onReorder(newOrder: string[]) -> returns array of module IDs in new order
 *
 * Styling uses Tailwind classes consistent with your dark UI.
 */

export type ModuleStatus = "proposed" | "approved" | "modified" | "rejected";

export interface SimpleModule {
  _id: string;
  name: string;
  order?: number;
  status?: ModuleStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges?: any[];
}

interface Props {
  modules: SimpleModule[];
  currentIndex: number;
  onSelectModule: (index: number) => void;
  onReorder?: (newOrderIds: string[]) => Promise<void> | void;
  compact?: boolean; // smaller display
}

export default function ModuleStepper({ modules, currentIndex, onSelectModule, onReorder, compact = false }: Props) {
  // sorted display by order fallback to array order
  const sorted = useMemo(() => {
    const copy = [...modules];
    copy.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return copy;
  }, [modules]);

  // simple stats
  const stats = useMemo(() => {
    const total = sorted.length;
    const approved = sorted.filter(m => m.status === "approved").length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [sorted]);

  useEffect(() => {
    // defensive: if currentIndex out of bounds, clamp
    if (currentIndex >= sorted.length && sorted.length > 0) {
      onSelectModule(Math.max(0, sorted.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.length]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const newList = Array.from(sorted);
    const [moved] = newList.splice(from, 1);
    newList.splice(to, 0, moved);

    // fire callback with module IDs
    const ids = newList.map(m => m._id);
    if (onReorder) {
      try {
        await onReorder(ids);
      } catch (err) {
        console.error("onReorder failed", err);
        // optionally show toast - but keep silent here
      }
    }
  }, [sorted, onReorder]);

  const badge = (status?: ModuleStatus) => {
    switch (status) {
      case "approved":
        return <span className="text-xs px-2 py-0.5 bg-green-700/80 rounded-full text-green-200">Approved</span>;
      case "modified":
        return <span className="text-xs px-2 py-0.5 bg-yellow-800/70 rounded-full text-yellow-200">Modified</span>;
      case "rejected":
        return <span className="text-xs px-2 py-0.5 bg-red-800/70 rounded-full text-red-200">Rejected</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-300">Pending</span>;
    }
  };

  return (
    <div className={clsx("h-full flex flex-col gap-4 p-4", compact ? "w-64" : "w-80")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Architecture Modules</h3>
          <p className="text-xs text-zinc-400 mt-1">Build module-by-module — approve to add to snapshot</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Progress</div>
          <div className="text-sm font-medium text-white">{stats.approved}/{stats.total}</div>
        </div>
      </div>

      {/* Drag list */}
      <div className="flex-1 overflow-auto pr-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules-droppable">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {sorted.map((m, idx) => {
                  const active = idx === currentIndex;
                  return (
                    <Draggable key={m._id} draggableId={m._id} index={idx}>
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          onClick={() => onSelectModule(idx)}
                          className={clsx(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none",
                            active ? "bg-zinc-800 border border-indigo-700/60 shadow-md" : "bg-zinc-900/50 border border-zinc-800",
                            snapshot.isDragging ? "opacity-90 scale-100" : ""
                          )}
                        >
                          {/* left: step number */}
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                            <span>{idx + 1}</span>
                          </div>

                          {/* title + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{m.name}</div>
                                <div className="text-xs text-zinc-400 truncate mt-0.5">{(m.nodes?.length ?? 0)} components</div>
                              </div>
                              <div className="ml-2">{badge(m.status)}</div>
                            </div>
                          </div>

                          {/* right icons */}
                          <div className="flex items-center gap-2">
                            {m.status === "approved" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-zinc-500" />}
                            <span className="text-zinc-400 text-xs ml-1 hidden lg:block">{m.status === "approved" ? "Approved" : "Pending"}</span>
                            <div {...draggableProvided.dragHandleProps} className="p-1 ml-2 rounded hover:bg-zinc-800/40">
                              <GripVertical className="w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Footer: quick stats + actions */}
      <div className="pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>Approved <span className="ml-1 font-medium text-white">{stats.approved}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
              <div>Pending <span className="ml-1 font-medium text-white">{stats.pending}</span></div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="Module progress details"
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs"
              onClick={() => {
                // lightweight helper — jump to first pending
                const firstPending = sorted.findIndex(m => m.status !== "approved");
                if (firstPending >= 0) onSelectModule(firstPending);
              }}
            >
              <Info className="w-3 h-3 inline-block mr-1" /> Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
