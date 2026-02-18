"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string; // Where to go after successful login
  initialMode?: "login" | "register"; // Which form to show initially
}

export default function LoginModal({ isOpen, onClose, redirectTo, initialMode = "login" }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  
  const router = useRouter();

  // Reset form when modal opens/closes or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    } else {
      setEmail("");
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `${mode === "login" ? "Login" : "Registration"} failed`);
      }

      // Store token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Success - navigate without full page refresh
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/");
      }
      
      // REMOVED: router.refresh() - causes full page reload
      // Instead, AuthContext will automatically update via localStorage
      // and components will re-render based on the new auth state
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
      console.error(`${mode} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md 
          bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl 
          animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="36" height="36" rx="9" fill="rgba(255,255,255,0.06)" />
                <path d="M14 18h20v4H14z" fill="white" fillOpacity="0.95" />
                <path d="M12 26h24v4H12z" fill="white" fillOpacity="0.85" />
                <path d="M16 14h6v4h-6zM26 14h6v4h-6z" fill="rgba(255,255,255,0.95)" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 id="modal-title" className="mt-6 text-center text-2xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Get started free"}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            {mode === "login" 
              ? "Sign in to continue to BuildWise" 
              : "Create your account to start building"}
          </p>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="sr-only" htmlFor="modal-email">
                Email
              </label>
              <input
                id="modal-email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 
                  text-white placeholder:text-zinc-500 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="modal-password">
                Password
              </label>
              <input
                id="modal-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 
                  text-white placeholder:text-zinc-500 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
            </div>

            {mode === "login" && (
              <div className="flex items-center">
                <input
                  id="modal-remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950/40 text-indigo-600 
                    focus:ring-2 focus:ring-indigo-500/30"
                />
                <label htmlFor="modal-remember" className="ml-2 text-sm text-zinc-400">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 
                text-white font-semibold py-3 rounded-xl 
                hover:from-indigo-700 hover:to-purple-700 
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
