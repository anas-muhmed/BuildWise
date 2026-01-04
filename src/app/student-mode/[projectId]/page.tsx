"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentModeEntry() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [appType, setAppType] = useState("");
  const [scale, setScale] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(false);

  const canProceed = appType && scale && priority;

  const handleSubmit = async () => {
    if (!canProceed) return;

    setLoading(true);

    await fetch("/api/student-mode/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        appType,
        scale,
        priority,
      }),
    });

    router.push(`/student-mode/${projectId}/reasoning`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">

        <h1 className="text-3xl font-bold">
          Let's define the problem first
        </h1>

        {/* App Type */}
        <div>
          <label className="block text-zinc-400 mb-2">
            What are you building?
          </label>
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            value={appType}
            onChange={(e) => setAppType(e.target.value)}
          >
            <option value="">Select</option>
            <option value="ecommerce">E-commerce</option>
            <option value="chat">Chat App</option>
            <option value="notes">Notes App</option>
            <option value="social">Social Platform</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Scale */}
        <div>
          <label className="block text-zinc-400 mb-2">
            Expected scale?
          </label>
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
          >
            <option value="">Select</option>
            <option value="small">Small (≤ 1k users)</option>
            <option value="medium">Medium (≤ 100k users)</option>
            <option value="large">Large (Millions)</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-zinc-400 mb-2">
            What matters most?
          </label>
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select</option>
            <option value="speed">Speed</option>
            <option value="cost">Low Cost</option>
            <option value="reliability">Reliability</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canProceed || loading}
          className={`w-full p-4 rounded font-semibold ${
            canProceed
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {loading ? "Saving..." : "Start Design Reasoning →"}
        </button>
      </div>
    </div>
  );
}
