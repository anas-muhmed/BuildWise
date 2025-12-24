// app/generative-ai/page.tsx
"use client";
import GenerateAIClient from "@/components/GenerateAIClient";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="Recent Work">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">
                AI-Powered Architecture
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Generative AI Design
            </h1>
            <p className="text-zinc-400 mb-6">
              Describe your idea and BuildWise will create a starter architecture you can edit.
            </p>
          </div>
        </div>

        <GenerateAIClient />
      </div>
    </DashboardLayoutWrapper>
  );
}