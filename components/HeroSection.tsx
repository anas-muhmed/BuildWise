"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import LoginModal from "@/components/LoginModal";

export default function HeroSection() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string>("/");
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const handleFeatureClick = (destination: string) => {
    console.log("🔍 Feature click - Auth state:", { isAuthenticated, isLoading });
    
    if (isLoading) {
      // Still checking auth, wait
      console.log("⏳ Still loading auth...");
      return;
    }
    
    if (isAuthenticated) {
      // Already logged in, go directly
      console.log("✅ Authenticated - navigating to:", destination);
      router.push(destination);
    } else {
      // Not logged in, show modal
      console.log("🔐 Not authenticated - showing modal for:", destination);
      setIntendedDestination(destination);
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <header className="relative isolate border-b bg-white">
        {/* subtle grid background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.04) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
              BuildWise
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              System Design Studio
            </span>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Welcome to BuildWise
            </h1>
            <p className="mt-4 text-lg leading-7 text-zinc-600">
              Build smarter, faster, and more professionally — AI‑assisted, versioned, and collaborative.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => handleFeatureClick("/design")}
                disabled={isLoading}
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start New Design
              </button>
              <button
                onClick={() => handleFeatureClick("/generative-ai")}
                disabled={isLoading}
                className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Try Generative AI
              </button>
              
              {/* Debug: Show auth state */}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.reload();
                  }}
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-all"
                  title="Clear token and reload to test modal"
                >
                  🔓 Logout (Test Modal)
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectTo={intendedDestination}
      />
    </>
  );
}
