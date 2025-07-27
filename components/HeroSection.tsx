"use client";
import { Card } from "@/components/ui/card";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden py-16 bg-zinc-50">
      {/* Optional: add a gradient blur in background */}
      <div className="absolute inset-0 flex justify-center">
        <div className="bg-gradient-to-br from-indigo-200 via-indigo-100 to-indigo-50 blur-3xl w-[600px] h-[600px] -z-10 rounded-full"></div>
      </div>

      <Card className="max-w-3xl mx-auto p-8 bg-white shadow-lg relative z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-800 mb-4">
          Welcome to BuildWise
        </h1>
        <p className="text-lg text-zinc-600 mb-6">
          Build smart systems step-by-step — AI-assisted, versioned, and interactive.
        </p>
      </Card>
    </div>
  );
}
