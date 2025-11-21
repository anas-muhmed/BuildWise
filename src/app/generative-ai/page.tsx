// app/generative-ai/page.tsx
"use client";
import GenerateAIClient from "@/components/GenerateAIClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

export default function Page() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold">Generative AI Design</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Describe your idea and BuildWise will create a starter architecture you can edit.
            </p>
          </header>

          <GenerateAIClient />
        </div>
      </div>
    </ProtectedRoute>
  );
}