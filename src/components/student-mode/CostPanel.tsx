"use client";

import { CostEstimate } from "@/lib/student-mode/cost-estimator";
import AIStatusBadge from "./AIStatusBadge";

export default function CostPanel({ estimate, source }: { estimate?: CostEstimate; source?: "ai" | "mock" }) {
  if (!estimate) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">
          💰 Cost & Resource Estimate
        </h3>
        <AIStatusBadge source={source} />
      </div>

      <div className="text-sm space-y-2">
        <div>
          <span className="text-zinc-400">Infra Level:</span>{" "}
          <span className="font-medium">{estimate.infraLevel}</span>
        </div>

        <div>
          <span className="text-zinc-400">Monthly Cost:</span>{" "}
          <span className="font-medium">{estimate.monthlyCostUSD}</span>
        </div>

        <div>
          <span className="text-zinc-400">Engineering Effort:</span>{" "}
          <span className="font-medium">{estimate.engineeringEffort}</span>
        </div>

        <div>
          <span className="text-zinc-400">Operational Risk:</span>{" "}
          <span className="font-medium">{estimate.operationalRisk}</span>
        </div>
      </div>

      {estimate.explanation && estimate.explanation.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs text-zinc-400">
          {estimate.explanation.map((line, i) => (
            <div key={i}>• {line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
