"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Sparkles, Zap, Shield, DollarSign, Clock, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

// ── Mock architecture proposals based on requirements ──────────────────────

interface ArchOption {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  layers: {
    frontend: { tech: string; reason: string };
    backend: { tech: string; reason: string };
    database: { tech: string; reason: string };
    hosting: { tech: string; reason: string };
    extras: string[];
  };
  pros: string[];
  cons: string[];
  monthlyCost: string;
  complexity: "Low" | "Medium" | "High";
  timeToShip: string;
  bestFor: string;
}

function generateOptions(requirements: any): ArchOption[] {
  const traffic = requirements?.traffic || "small";
  const budget = requirements?.budget || "low";
  const features = requirements?.must_have_features || [];
  const hasRealtime = features.includes("Real-time tracking") || features.includes("Chat/Messaging");
  const hasPayments = features.includes("Payments");

  return [
    {
      id: "speed",
      name: "The Speed Machine",
      tagline: "Ship fast, iterate faster",
      icon: <Zap className="w-6 h-6" />,
      gradient: "from-amber-500 to-orange-500",
      borderColor: "border-amber-500/40",
      shadowColor: "shadow-amber-500/20",
      layers: {
        frontend: { tech: "Next.js + Tailwind CSS", reason: "Full-stack framework with built-in API routes, SSR, and ISR. Ship fast." },
        backend: { tech: "Next.js API Routes + Prisma", reason: "Zero config backend. Prisma makes DB queries type-safe and fast to write." },
        database: { tech: "PostgreSQL (Supabase)", reason: "Managed Postgres with built-in auth, realtime, and storage. No DevOps needed." },
        hosting: { tech: "Vercel", reason: "Zero-config deployment, edge functions, automatic HTTPS and CDN." },
        extras: [
          hasPayments ? "Stripe for payments" : null,
          hasRealtime ? "Supabase Realtime" : null,
          "Resend for emails",
          "Vercel Analytics"
        ].filter(Boolean) as string[]
      },
      pros: [
        "Fastest time to market",
        "Minimal infrastructure management",
        "Great developer experience",
        "Everything in one framework"
      ],
      cons: [
        "Vendor lock-in to Vercel",
        "Limited control over infrastructure",
        "Can get expensive at scale"
      ],
      monthlyCost: budget === "low" ? "$0–$25" : "$25–$100",
      complexity: "Low",
      timeToShip: "2–4 weeks",
      bestFor: "MVPs, startups, solo developers"
    },
    {
      id: "balanced",
      name: "The Balanced Stack",
      tagline: "Production-ready from day one",
      icon: <Shield className="w-6 h-6" />,
      gradient: "from-blue-500 to-indigo-500",
      borderColor: "border-blue-500/40",
      shadowColor: "shadow-blue-500/20",
      layers: {
        frontend: { tech: "React + Vite + Tailwind", reason: "Lightweight, fast builds, full control over bundling." },
        backend: { tech: "Node.js + Express + TypeScript", reason: "Battle-tested stack. Mature ecosystem, easy to hire for." },
        database: { tech: traffic === "large" ? "PostgreSQL + Redis" : "MongoDB Atlas + Redis", reason: traffic === "large" ? "Relational DB for complex queries + Redis for caching." : "Flexible schema for rapid iteration + Redis for sessions." },
        hosting: { tech: "AWS (ECS Fargate) or Railway", reason: "Scalable containers without managing servers. Auto-scaling built in." },
        extras: [
          hasPayments ? "Stripe" : null,
          hasRealtime ? "Socket.io" : null,
          "JWT auth + bcrypt",
          "Winston logging",
          "Docker containers",
          "GitHub Actions CI/CD"
        ].filter(Boolean) as string[]
      },
      pros: [
        "Production-grade from the start",
        "Scales well to 100K+ users",
        "No vendor lock-in",
        "Easy to hire developers for"
      ],
      cons: [
        "More initial setup time",
        "Need to manage more infrastructure",
        "Higher learning curve"
      ],
      monthlyCost: budget === "low" ? "$15–$50" : "$50–$200",
      complexity: "Medium",
      timeToShip: "4–8 weeks",
      bestFor: "Growing startups, professional projects"
    },
    {
      id: "enterprise",
      name: "The Enterprise Beast",
      tagline: "Built for millions of users",
      icon: <Sparkles className="w-6 h-6" />,
      gradient: "from-purple-500 to-pink-500",
      borderColor: "border-purple-500/40",
      shadowColor: "shadow-purple-500/20",
      layers: {
        frontend: { tech: "Next.js + React Query + Zustand", reason: "SSR for SEO, React Query for server state, Zustand for client state." },
        backend: { tech: "Microservices (Node.js + Go)", reason: "Service isolation. Node for API gateway, Go for high-throughput services." },
        database: { tech: "PostgreSQL + MongoDB + Redis + ElasticSearch", reason: "Polyglot persistence — right DB for each job. Search, cache, relational, document." },
        hosting: { tech: "Kubernetes (AWS EKS)", reason: "Full orchestration, auto-scaling, self-healing containers." },
        extras: [
          hasPayments ? "Stripe + fraud detection" : null,
          hasRealtime ? "Apache Kafka + WebSocket gateway" : null,
          "OAuth 2.0 + RBAC",
          "Prometheus + Grafana monitoring",
          "Terraform IaC",
          "ArgoCD for GitOps",
          "Rate limiting + circuit breakers"
        ].filter(Boolean) as string[]
      },
      pros: [
        "Handles millions of concurrent users",
        "Independent service scaling",
        "Full observability and monitoring",
        "Enterprise-grade security"
      ],
      cons: [
        "Complex infrastructure",
        "Requires DevOps expertise",
        "High monthly costs",
        "Over-engineered for small apps"
      ],
      monthlyCost: "$200–$2000+",
      complexity: "High",
      timeToShip: "3–6 months",
      bestFor: "Enterprise apps, high-traffic platforms"
    }
  ];
}

// ── Proposal Page ──────────────────────────────────────────────────────────

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [requirements, setRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const token = localStorage.getItem("token");
    fetch(`/api/generative/projects/${projectId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(data => {
        setRequirements(data.requirements || {});
        setLoading(false);
        // Simulate AI "thinking" animation
        setTimeout(() => {
          setIsGenerating(false);
          setTimeout(() => setShowOptions(true), 100);
        }, 2200);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  const options = generateOptions(requirements);
  const selected = options.find(o => o.id === selectedId);

  const handleApprove = () => {
    if (!selected) return;
    // Store the selection in localStorage for the builder page
    localStorage.setItem(`proposal-${projectId}`, JSON.stringify(selected));
    router.push(`/generative-ai/${projectId}/builder`);
  };

  if (loading || isGenerating) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposal">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-spin" style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)" }} />
              <div className="absolute inset-1 rounded-full bg-zinc-950 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Analyzing your requirements...</p>
              <p className="text-sm text-zinc-500 mt-1">Generating 3 architecture proposals tailored to your project</p>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Traffic analysis</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Feature mapping</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" /> Stack selection</span>
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Architecture Proposals
            </h1>
            <p className="text-sm text-zinc-500 mt-1">We analyzed your requirements and generated 3 architecture approaches. Pick the one that fits.</p>
          </div>
          <button
            onClick={() => { setIsGenerating(true); setShowOptions(false); setSelectedId(null); setTimeout(() => { setIsGenerating(false); setTimeout(() => setShowOptions(true), 100); }, 2200); }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* 3 Option Cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 ${showOptions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`relative text-left rounded-2xl border p-6 transition-all duration-300 cursor-pointer group
                  ${isSelected
                    ? `${opt.borderColor} bg-zinc-900/90 scale-[1.02] shadow-xl ${opt.shadowColor} ring-2 ring-current`
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70"
                  }`}
              >
                {/* Badge */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">✓</div>
                )}

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{opt.name}</h3>
                    <p className="text-xs text-zinc-500">{opt.tagline}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <DollarSign className="w-3 h-3 mx-auto text-green-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.monthlyCost}</div>
                    <div className="text-[10px] text-zinc-600">monthly</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <Clock className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.timeToShip}</div>
                    <div className="text-[10px] text-zinc-600">to ship</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <Zap className="w-3 h-3 mx-auto text-amber-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.complexity}</div>
                    <div className="text-[10px] text-zinc-600">complexity</div>
                  </div>
                </div>

                {/* Stack Preview */}
                <div className="space-y-1.5 mb-4">
                  {Object.entries(opt.layers).filter(([k]) => k !== "extras").map(([layer, info]) => (
                    <div key={layer} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-zinc-600 capitalize shrink-0">{layer}</span>
                      <span className="text-zinc-300 font-medium">{(info as any).tech}</span>
                    </div>
                  ))}
                </div>

                {/* Pros */}
                <div className="space-y-1">
                  {opt.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-green-400">
                      <span>✓</span> {pro}
                    </div>
                  ))}
                  {opt.cons.slice(0, 1).map((con, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400">
                      <span>⚠</span> {con}
                    </div>
                  ))}
                </div>

                {/* Best For */}
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Best for</p>
                  <p className="text-xs text-zinc-400">{opt.bestFor}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed View (when selected) */}
        {selected && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.name} — Full Stack Breakdown</h2>
                <p className="text-sm text-zinc-500 mt-1">Here&apos;s exactly why each technology was chosen for your project.</p>
              </div>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                Use This Stack
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Layer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selected.layers).filter(([k]) => k !== "extras").map(([layer, info]) => (
                <div key={layer} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{layer}</span>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">{(info as any).tech}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{(info as any).reason}</p>
                </div>
              ))}
            </div>

            {/* Extras */}
            {selected.layers.extras.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Additional Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.layers.extras.map((extra, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs bg-zinc-800/60 border border-zinc-700/50 rounded-full text-zinc-300">
                      {extra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">Advantages</h3>
                <div className="space-y-1.5">
                  {selected.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-green-400 mt-0.5">✓</span> {pro}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-2">Trade-offs</h3>
                <div className="space-y-1.5">
                  {selected.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-amber-400 mt-0.5">⚠</span> {con}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
