// app/generative-ai/page.tsx
"use client";
import GenerateAIClient from "@/components/GenerateAIClient";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="Recent Work">
      <div className="space-y-6">
        {/* Deprecation Notice */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-300 mb-1">⚠️ Legacy Version - Deprecated</h3>
              <p className="text-zinc-300 mb-3">
                This is the old version of Generative AI. We&apos;ve built a much better version with improved features and workflow.
              </p>
              <a 
                href="/generative-ai" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Switch to New Version
              </a>
            </div>
          </div>
        </div>

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