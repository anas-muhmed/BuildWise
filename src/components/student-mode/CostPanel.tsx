"use client";

import { CostEstimate } from "@/lib/student-mode/cost-estimator";

export default function CostPanel({ estimate }: { estimate: CostEstimate }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-200">
        💰 Cost & Resource Estimate
      </h3>

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

      <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs text-zinc-400">
        {estimate.explanation.map((line, i) => (
          <div key={i}>• {line}</div>
        ))}
      </div>
    </div>
  );
}
