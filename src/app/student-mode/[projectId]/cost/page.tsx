"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StepFooter from "@/components/student-mode/StepFooter";
import AIStatusBadge from "@/components/student-mode/AIStatusBadge";

export default function CostPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [infraLevel, setInfraLevel] = useState("Low");
  const [monthlyCostUSD, setMonthlyCostUSD] = useState<string>("$20-$50");
  const [engineeringEffort, setEngineeringEffort] = useState<string>("Low");
  const [operationalRisk, setOperationalRisk] = useState<string>("Low");
  const [explanation, setExplanation] = useState<string[]>([]);
  const [source, setSource] = useState<"ai" | "mock">("mock");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Call AI cost estimation endpoint
    fetch(`/api/student-mode/cost?projectId=${projectId}`)
      .then(r => r.json())
      .then(data => {
        setInfraLevel(data.infraLevel || "Low");
        setMonthlyCostUSD(data.monthlyCostUSD || "$20-$50");
        setEngineeringEffort(data.engineeringEffort || "Low");
        setOperationalRisk(data.operationalRisk || "Low");
        setExplanation(data.explanation || []);
        setSource(data.source || "mock");
        setLoaded(true);
      })
      .catch(err => {
        console.error("Failed to fetch cost:", err);
        // Fallback to defaults
        setLoaded(true);
      });
  }, [projectId]);



  if (!loaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          Computing AI cost estimate...
        </div>
      </div>
    );
  }

  const levelColor = infraLevel === "High" ? "#ef4444" : infraLevel === "Medium" ? "#f59e0b" : "#10b981";

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-3xl mx-auto p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Cost & Resource Estimate
            </h1>
            <AIStatusBadge source={source} />
          </div>
          <p className="text-zinc-400 mt-2">
            Based on the generated architecture.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Infra Level</div>
            <div className="text-2xl font-black" style={{ color: levelColor }}>{infraLevel}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Monthly Cost</div>
            <div className="text-2xl font-black text-orange-400">{monthlyCostUSD}</div>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Engineering Effort</div>
            <div className="text-lg font-bold text-blue-400">{engineeringEffort}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Operational Risk</div>
            <div className="text-lg font-bold text-purple-400">{operationalRisk}</div>
          </div>
        </div>

        {/* AI Explanation */}
        {explanation.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">💡 Cost Analysis</h3>
            <ul className="space-y-3">
              {explanation.map((line, i) => (
                <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-400 space-y-2">
          <p>💡 <strong className="text-zinc-300">These are AI-generated estimates</strong> — each component's cost is computed based on cloud provider pricing (AWS/GCP/Vercel).</p>
          <p>The more components you add, the higher the operational cost. This is the trade-off between features and budget.</p>
          {infraLevel === "High" && <p className="text-red-400">⚠ High infrastructure level — consider if all components are truly needed for your scale.</p>}
        </div>
      </div>

      <StepFooter projectId={projectId} currentStep="cost" canContinue={true} />
    </div>
  );
}
