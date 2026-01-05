"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StepFooter from "@/components/student-mode/StepFooter";

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

  const canContinue = !!name && !!goal && !!audience;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-2xl space-y-8">

        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent relative">
              Define Your Project
            </h1>
          </div>
          <p className="text-sm text-zinc-500">Step 1 of 6 • Project Setup</p>
        </div>

        {/* Project Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Project Name</label>
          <input
            className="w-full p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none hover:border-zinc-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Online Food Ordering System"
          />
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            What does this system do? (1 line)
          </label>
          <input
            className="w-full p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none hover:border-zinc-600"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Allow users to order food and track delivery"
          />
        </div>

        {/* Audience */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Who will use this system?
          </label>

          <div className="grid grid-cols-3 gap-3">
            {["customers", "admins", "both"].map((a) => (
              <label
                key={a}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  audience === a
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  checked={audience === a}
                  onChange={() => setAudience(a as any)}
                  className="sr-only"
                />
                <span className={`text-center block capitalize font-medium ${
                  audience === a ? "text-purple-400" : "text-zinc-400"
                }`}>{a}</span>
                {audience === a && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading || !canContinue}
          className="group relative w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
        >
          {loading ? "Creating..." : "Continue to Reasoning →"}
        </button>
      </div>

      <StepFooter projectId={projectId} currentStep="setup" canContinue={false} />
    </div>
  );
}
