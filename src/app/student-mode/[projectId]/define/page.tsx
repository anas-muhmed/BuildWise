"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StepFooter from "@/components/student-mode/StepFooter";

type DefinePayload = {
  projectName: string;
  description: string;
  targetUsers: "students" | "admins" | "both";
  scale: "small" | "medium" | "large";
  realtime: boolean;
  dataSensitivity: "low" | "medium" | "high";
};

export default function DefineProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [form, setForm] = useState<DefinePayload>({
    projectName: "",
    description: "",
    targetUsers: "students",
    scale: "small",
    realtime: false,
    dataSensitivity: "low",
  });
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof DefinePayload>(
    key: K,
    value: DefinePayload[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async () => {
    if (!form.projectName.trim()) {
      alert("Project name is required");
      return;
    }

    setLoading(true);

    await fetch("/api/student-mode/define", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...form }),
    });

    router.push(`/student-mode/${projectId}/reasoning`);
  };

  const canContinue = !!form.projectName.trim();

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
          <p className="text-zinc-400">
            This information sets the context. Architecture decisions come later.
          </p>
        </div>

        {/* Project Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Project Name</label>
          <input
            className="w-full p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none hover:border-zinc-600"
            value={form.projectName}
            maxLength={60}
            onChange={(e) => update("projectName", e.target.value)}
            placeholder="e.g. Campus Food Ordering System"
          />
        </div>

        {/* Description (LOW AUTHORITY) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Short Description <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            className="w-full p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none hover:border-zinc-600 resize-none"
            rows={3}
            maxLength={200}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="One or two lines about what this app does"
          />
          <p className="text-xs text-zinc-500">
            Used only for display and summary. Does not affect architecture.
          </p>
        </div>

        {/* Target Users */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Who will use this system?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["students", "admins", "both"] as const).map((v) => (
              <label
                key={v}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.targetUsers === v
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  checked={form.targetUsers === v}
                  onChange={() => update("targetUsers", v)}
                  className="sr-only"
                />
                <span className={`text-center block capitalize font-medium ${
                  form.targetUsers === v ? "text-purple-400" : "text-zinc-400"
                }`}>{v}</span>
                {form.targetUsers === v && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">Expected scale</label>
          <div className="space-y-2">
            {[
              ["small", "Class project / demo"],
              ["medium", "Department or college-level"],
              ["large", "Public or production-like"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.scale === value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  checked={form.scale === value}
                  onChange={() => update("scale", value as any)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className={form.scale === value ? "text-blue-400 font-medium" : "text-zinc-300"}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Realtime */}
        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.realtime
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600"
            }`}
          >
            <input
              type="checkbox"
              checked={form.realtime}
              onChange={(e) => update("realtime", e.target.checked)}
              className="w-5 h-5 text-cyan-500 focus:ring-cyan-500 rounded"
            />
            <span className={`font-medium ${form.realtime ? "text-cyan-400" : "text-zinc-300"}`}>
              Requires real-time updates (chat, live status, etc.)
            </span>
          </label>
        </div>

        {/* Data Sensitivity */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">Data sensitivity</label>
          <div className="space-y-2">
            {[
              ["low", "Public / non-sensitive"],
              ["medium", "User accounts, profiles"],
              ["high", "Payments, personal data"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.dataSensitivity === value
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  checked={form.dataSensitivity === value}
                  onChange={() => update("dataSensitivity", value as any)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className={form.dataSensitivity === value ? "text-orange-400 font-medium" : "text-zinc-300"}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading || !canContinue}
          className="group relative w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
        >
          {loading ? "Saving..." : "Continue to Reasoning →"}
        </button>
      </div>

      <StepFooter projectId={projectId} currentStep="define" canContinue={false} />
    </div>
  );
}
