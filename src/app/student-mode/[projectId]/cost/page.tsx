"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StepFooter from "@/components/student-mode/StepFooter";

export default function CostPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [graph, setGraph] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const archRes = await fetch(`/api/student-mode/materialize?projectId=${projectId}`);
        const architecture = await archRes.json();
        
        if (!architecture.nodes) return;

        setGraph(architecture);

        // Compute cost estimate
        const nodeTypes = architecture.nodes.map((n: any) => n.type);
        const hasCache = nodeTypes.includes("cache");
        const hasQueue = nodeTypes.includes("queue");
        const hasMicroservices = nodeTypes.filter((t: string) => t === "backend").length > 1;
        
        let infraScore = 1;
        if (hasCache) infraScore += 1;
        if (hasQueue) infraScore += 1;
        if (hasMicroservices) infraScore += 2;

        let infraLevel = "Low";
        let monthlyCostUSD = "$20 – $40";

        if (infraScore >= 4 && infraScore <= 6) {
          infraLevel = "Medium";
          monthlyCostUSD = "$60 – $120";
        }

        if (infraScore > 6) {
          infraLevel = "High";
          monthlyCostUSD = "$150 – $300";
        }

        const teamSize = 3;
        const engineeringEffort = teamSize <= 2 ? "Low" : teamSize <= 4 ? "Medium" : "High";
        const operationalRisk = infraScore > 6 ? "High" : infraScore >= 4 ? "Medium" : "Low";

        const explanation = [
          `Architecture contains ${architecture.nodes.length} components.`,
          hasMicroservices
            ? "Multiple backend services increase deployment complexity."
            : "Single backend keeps deployment simple.",
          hasCache ? "Cache improves performance but adds operational overhead." : "",
          hasQueue ? "Queue enables async processing but needs monitoring." : "",
        ].filter(Boolean);

        setCostEstimate({
          infraLevel,
          monthlyCostUSD,
          engineeringEffort,
          operationalRisk,
          explanation
        });
      } catch (err) {
        console.error("Failed to load cost data:", err);
      }
    }

    loadData();
  }, [projectId]);

  if (!graph || !costEstimate) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading cost analysis...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8 space-y-2">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-2xl"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent relative">
              Cost & Resource Estimate
            </h1>
          </div>
          <p className="text-zinc-400">
            Infrastructure and operational analysis
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all">
            <div className="text-xs text-zinc-400 uppercase font-semibold mb-2">Infrastructure Level</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{costEstimate.infraLevel}</div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="text-xs text-zinc-400 uppercase font-semibold mb-2">Monthly Cost</div>
            <div className="text-3xl font-bold text-green-400">{costEstimate.monthlyCostUSD}</div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="text-xs text-zinc-400 uppercase font-semibold mb-2">Engineering Effort</div>
            <div className="text-3xl font-bold text-yellow-400">{costEstimate.engineeringEffort}</div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6 hover:border-orange-500/50 transition-all">
            <div className="text-xs text-zinc-400 uppercase font-semibold mb-2">Operational Risk</div>
            <div className="text-3xl font-bold text-orange-400">{costEstimate.operationalRisk}</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-4">Analysis</h2>
          <div className="space-y-2 text-sm text-zinc-300">
            {costEstimate.explanation.map((line: string, i: number) => (
              <div key={i}>• {line}</div>
            ))}
          </div>
        </div>
      </div>

      <StepFooter projectId={projectId} currentStep="cost" canContinue={true} />
    </div>
  );
}
