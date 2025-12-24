"use client";

import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 🎯 NodeEditor - Modal for modifying module nodes/edges
 * Master's Design: Inline form for student edits before approval
 */

interface ModuleNode {
  id: string;
  type: string;
  label: string;
  meta?: Record<string, unknown>;
}

interface ModuleEdge {
  from: string;
  to: string;
  label?: string;
}

interface Module {
  _id: string;
  name: string;
  description?: string;
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  rationale?: string;
}

interface Props {
  module: Module;
  onSave: (updatedModule: Partial<Module>) => void;
  onClose: () => void;
}

const NODE_TYPES = [
  "client", "frontend", "gateway", "service", "database", 
  "cache", "queue", "messaging", "auth", "blob_storage",
  "search", "realtime", "worker", "monitoring", "cdn"
];

export default function NodeEditor({ module, onSave, onClose }: Props) {
  const [name, setName] = useState(module.name);
  const [description, setDescription] = useState(module.description || "");
  const [rationale, setRationale] = useState(module.rationale || "");
  const [nodes, setNodes] = useState<ModuleNode[]>(module.nodes);
  const [edges, setEdges] = useState<ModuleEdge[]>(module.edges);

  const handleAddNode = () => {
    setNodes([
      ...nodes,
      {
        id: `node_${Date.now()}`,
        type: "service",
        label: "New Node",
        meta: {}
      }
    ]);
  };

  const handleRemoveNode = (index: number) => {
    const removedNodeId = nodes[index].id;
    setNodes(nodes.filter((_, i) => i !== index));
    // Remove edges connected to this node
    setEdges(edges.filter(e => e.from !== removedNodeId && e.to !== removedNodeId));
  };

  const handleUpdateNode = (index: number, field: keyof ModuleNode, value: string | Record<string, unknown>) => {
    const updated = [...nodes];
    updated[index] = { ...updated[index], [field]: value };
    setNodes(updated);
  };

  const handleAddEdge = () => {
    if (nodes.length < 2) {
      alert("Add at least 2 nodes before creating edges");
      return;
    }
    setEdges([
      ...edges,
      {
        from: nodes[0].id,
        to: nodes[1].id,
        label: ""
      }
    ]);
  };

  const handleRemoveEdge = (index: number) => {
    setEdges(edges.filter((_, i) => i !== index));
  };

  const handleUpdateEdge = (index: number, field: keyof ModuleEdge, value: string) => {
    const updated = [...edges];
    updated[index] = { ...updated[index], [field]: value };
    setEdges(updated);
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      rationale,
      nodes,
      edges
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Module
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rationale
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              placeholder="Why is this module needed? What problem does it solve?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nodes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Nodes ({nodes.length})
              </label>
              <Button onClick={handleAddNode} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Node
              </Button>
            </div>
            <div className="space-y-3">
              {nodes.map((node, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Node ID</label>
                        <input
                          type="text"
                          value={node.id}
                          onChange={(e) => handleUpdateNode(index, "id", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <select
                          value={node.type}
                          onChange={(e) => handleUpdateNode(index, "type", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {NODE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Label</label>
                        <input
                          type="text"
                          value={node.label}
                          onChange={(e) => handleUpdateNode(index, "label", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveNode(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Edges ({edges.length})
              </label>
              <Button onClick={handleAddEdge} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Edge
              </Button>
            </div>
            <div className="space-y-3">
              {edges.map((edge, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">From</label>
                        <select
                          value={edge.from}
                          onChange={(e) => handleUpdateEdge(index, "from", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">To</label>
                        <select
                          value={edge.to}
                          onChange={(e) => handleUpdateEdge(index, "to", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Label</label>
                        <input
                          type="text"
                          value={edge.label || ""}
                          onChange={(e) => handleUpdateEdge(index, "label", e.target.value)}
                          placeholder="Optional"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEdge(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
