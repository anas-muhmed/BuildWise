// app/register/page.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
// import { useAuth } from "@/lib/authContext"; // Commented out as it's not used in the new design
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Redirect to home
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (password.length < 8) return { strength: 50, label: "Fair", color: "bg-yellow-500" };
    if (password.length < 12) return { strength: 75, label: "Good", color: "bg-blue-500" };
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_70%)]"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Join BuildWise</h1>
          <p className="text-zinc-400 text-sm">Create your account and start building amazing architectures</p>
        </div>

        {/* Register Form */}
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm text-zinc-400 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm text-zinc-400 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors pl-12"
                  placeholder="john@example.com"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  📧
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm text-zinc-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors pl-12 pr-12"
                  placeholder="Create a strong password"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  🔒
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-500">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength < 50 ? 'text-red-400' : 
                      passwordStrength.strength < 75 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-zinc-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors pl-12 pr-12 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-500/50 bg-red-500/10 text-white' 
                      : 'bg-zinc-900 border-white/10 text-white focus:border-indigo-500/50'
                  } placeholder:text-zinc-600`}
                  placeholder="Confirm your password"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500">
                  🔐
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">Passwords don&apos;t match</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-zinc-900 border-white/10 rounded focus:ring-indigo-500 mt-1"
                required
              />
              <label htmlFor="acceptTerms" className="ml-3 text-sm text-zinc-400">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                "Create Account 🚀"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-4 text-sm text-zinc-500">or sign up with</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          {/* Social Register Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors">
              <span className="text-lg mr-2">🔗</span>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors">
              <span className="text-lg mr-2">📘</span>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            🔒 Your data is secure with 256-bit encryption
          </p>
        </div>
      </div>
    </div>
  );
}