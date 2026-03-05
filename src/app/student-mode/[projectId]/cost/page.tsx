"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadBuild } from "@/lib/student-mode/build-store";
import { COMPONENTS, ComponentId } from "@/lib/student-mode/component-catalog";
import StepFooter from "@/components/student-mode/StepFooter";
import AIStatusBadge from "@/components/student-mode/AIStatusBadge";

// Monthly cost per component (USD, approximate cloud pricing)
const COMPONENT_COST: Record<ComponentId, { min: number; max: number; note: string }> = {
  "web-frontend": { min: 0, max: 5, note: "Static hosting (Vercel/Netlify free tier)" },
  "mobile-app": { min: 0, max: 10, note: "App store fees + CI build minutes" },
  "api-server": { min: 10, max: 25, note: "1–2 vCPU cloud instance" },
  "backend-worker": { min: 5, max: 15, note: "Worker process / Lambda invocations" },
  "microservices": { min: 30, max: 80, note: "Multiple containers (Kubernetes overhead)" },
  "primary-db": { min: 15, max: 40, note: "Managed DB instance (RDS/PlanetScale)" },
  "read-replica": { min: 15, max: 40, note: "Replica instance (same cost as primary)" },
  "cache": { min: 10, max: 25, note: "Redis managed instance (Upstash free → paid)" },
  "load-balancer": { min: 15, max: 25, note: "Cloud load balancer (ALB/GCP LB)" },
  "api-gateway": { min: 5, max: 15, note: "API calls + routing (AWS API Gateway)" },
  "cdn": { min: 0, max: 10, note: "CDN bandwidth (mostly free at small scale)" },
  "object-storage": { min: 2, max: 10, note: "S3/GCS storage + egress" },
  "message-queue": { min: 5, max: 20, note: "Managed queue (SQS/RabbitMQ)" },
  "auth-service": { min: 0, max: 15, note: "Auth0/Clerk free tier → paid at scale" },
  "waf": { min: 10, max: 30, note: "WAF rules + traffic filtering" },
  "monitoring": { min: 0, max: 20, note: "Datadog/Grafana Cloud free tier → paid" },
};

export default function CostPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [items, setItems] = useState<{ id: ComponentId; name: string; icon: string; min: number; max: number; note: string }[]>([]);
  const [totalMin, setTotalMin] = useState(0);
  const [totalMax, setTotalMax] = useState(0);
  const [infraLevel, setInfraLevel] = useState("Low");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const buildData = loadBuild(projectId);

    if (buildData?.selectedIds?.length) {
      // Use student's own build
      const selected = buildData.selectedIds as ComponentId[];
      const lineItems = selected.map((id) => {
        const comp = COMPONENTS.find((c) => c.id === id)!;
        const cost = COMPONENT_COST[id] ?? { min: 5, max: 20, note: "Cloud service" };
        return { id, name: comp?.name ?? id, icon: comp?.icon ?? "⚙️", ...cost };
      });
      setItems(lineItems);
      const min = lineItems.reduce((s, x) => s + x.min, 0);
      const max = lineItems.reduce((s, x) => s + x.max, 0);
      setTotalMin(min);
      setTotalMax(max);
      setInfraLevel(max > 150 ? "High" : max > 70 ? "Medium" : "Low");
    } else {
      // Fallback: fetch AI architecture and compute
      fetch(`/api/student-mode/materialize?projectId=${projectId}`)
        .then(r => r.json())
        .then(response => {
          const arch = response.architecture || response;
          const nodes: any[] = arch?.nodes ?? [];
          const hasCache = nodes.some((n: any) => n.type === "cache");
          const hasQueue = nodes.some((n: any) => n.type === "queue");
          const hasMicro = nodes.filter((n: any) => n.type === "backend").length > 1;
          let infraScore = 1;
          if (hasCache) infraScore += 1;
          if (hasQueue) infraScore += 1;
          if (hasMicro) infraScore += 2;
          const level = infraScore > 6 ? "High" : infraScore >= 4 ? "Medium" : "Low";
          setInfraLevel(level);
          setTotalMin(level === "High" ? 150 : level === "Medium" ? 60 : 20);
          setTotalMax(level === "High" ? 300 : level === "Medium" ? 120 : 40);
        });
    }
    setLoaded(true);
  }, [projectId]);



  if (!loaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          Computing cost estimate...
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Cost & Resource Estimate
          </h1>
          <p className="text-zinc-400 mt-2">
            {items.length > 0
              ? `Based on the ${items.length} components you selected in your architecture design.`
              : "Based on the generated architecture."}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Infra Level</div>
            <div className="text-2xl font-black" style={{ color: levelColor }}>{infraLevel}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Monthly Min</div>
            <div className="text-2xl font-black text-green-400">${totalMin}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Monthly Max</div>
            <div className="text-2xl font-black text-orange-400">${totalMax}</div>
          </div>
        </div>

        {/* Per-component breakdown */}
        {items.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Your Component Pricing Breakdown</span>
              <span className="text-xs text-zinc-500">All prices USD/month (cloud estimates)</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800/50">
                  <th className="text-left px-5 py-2.5">Component</th>
                  <th className="text-right px-5 py-2.5">Min</th>
                  <th className="text-right px-5 py-2.5">Max</th>
                  <th className="text-left px-5 py-2.5 hidden sm:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-zinc-800/30 ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                    <td className="px-5 py-3 text-zinc-200">
                      <span className="mr-2">{item.icon}</span>{item.name}
                    </td>
                    <td className="px-5 py-3 text-right text-green-400 font-mono">${item.min}</td>
                    <td className="px-5 py-3 text-right text-orange-400 font-mono">${item.max}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs hidden sm:table-cell">{item.note}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2 border-zinc-700 bg-zinc-900/80">
                  <td className="px-5 py-3 font-bold text-white">Total</td>
                  <td className="px-5 py-3 text-right font-black text-green-400 font-mono">${totalMin}</td>
                  <td className="px-5 py-3 text-right font-black text-orange-400 font-mono">${totalMax}</td>
                  <td className="px-5 py-3 hidden sm:table-cell" />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-400 space-y-2">
          <p>💡 <strong className="text-zinc-300">These are algorithmic estimates</strong> — each component's cost is computed independently based on cloud provider pricing (AWS/GCP/Vercel).</p>
          <p>The more components you add, the higher the operational cost. This is the trade-off between features and budget.</p>
          {infraLevel === "High" && <p className="text-red-400">⚠ High infrastructure level — consider if all components are truly needed for your scale.</p>}
        </div>
      </div>

      <StepFooter projectId={projectId} currentStep="cost" canContinue={true} />
    </div>
  );
}
