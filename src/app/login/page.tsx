// app/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [remember, setRemember] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // redirect to dashboard
      router.push("/");
    } catch (err: unknown) {
      setError((err as Error)?.message || "Unexpected error");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 text-white overflow-auto">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 bg-gradient-to-br from-blue-600 to-purple-600"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12" role="main">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300">
            BuildWise
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            System Design Studio
          </span>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
            Welcome back
          </h1>
          <p className="text-zinc-400 text-center max-w-sm">
            Sign in to continue building professional system architectures with AI assistance
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl p-8">

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { /* replace with your social auth */ }}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M44 24.5c0-.7-.06-1.3-.17-1.92H24v4.02h11.95c-.52 2.82-2.1 5.2-4.48 6.8v2.84h7.25C41.5 35.9 44 30.6 44 24.5z" fill="#4285F4"/>
                <path d="M24 44c5.9 0 10.84-1.98 14.45-5.38l-7.25-2.84c-2.02 1.36-4.6 2.1-7.2 2.1-5.54 0-10.24-3.73-11.92-8.74H4.24v2.76C7.88 38.66 15.48 44 24 44z" fill="#34A853"/>
                <path d="M12.08 27.04a14.5 14.5 0 017.92-10.47v-2.92H12.75A24.02 24.02 0 004 24.5c0 3.8.92 7.4 2.59 10.66l5.49-2.12z" fill="#FBBC05"/>
                <path d="M24 13.5c3.21 0 6.12 1.1 8.4 3.27l6.27-6.27C35.36 6.72 30.45 4.5 24 4.5 15.48 4.5 7.88 9.84 4.24 17.27l7.83 2.76C13.76 17.23 18.46 13.5 24 13.5z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => { /* replace with your social auth */ }}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.16 6.84 9.5.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.71-2.78.61-3.37-1.34-3.37-1.34-.45-1.17-1.11-1.48-1.11-1.48-.91-.62.07-.6.07-.6 1.01.07 1.54 1.05 1.54 1.05.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0112 6.85c.85.004 1.71.12 2.51.35 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .26.16.58.67.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
