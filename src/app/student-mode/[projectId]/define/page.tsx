"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DefineProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState<"customers" | "admins" | "both" | "">("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !goal || !audience) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    await fetch("/api/student-mode/define", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name,
        goal,
        audience,
      }),
    });

    router.push(`/student-mode/${projectId}/reasoning`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Define Your Project
        </h1>

        {/* Project Name */}
        <div>
          <label className="block mb-1 text-zinc-400">Project Name</label>
          <input
            className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Online Food Ordering System"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="block mb-1 text-zinc-400">
            What does this system do? (1 line)
          </label>
          <input
            className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Allow users to order food and track delivery"
          />
        </div>

        {/* Audience */}
        <div>
          <label className="block mb-2 text-zinc-400">
            Who will use this system?
          </label>

          <div className="space-y-2">
            {["customers", "admins", "both"].map((a) => (
              <label
                key={a}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="audience"
                  checked={audience === a}
                  onChange={() => setAudience(a as any)}
                />
                <span className="capitalize">{a}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
