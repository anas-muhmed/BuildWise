"use client";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Public Landing Page
 * - Shows when user is NOT authenticated
 * - Marketing content with CTA to register/login
 */

export default function PublicLandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to app
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BuildWise
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <button className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                  Get Started Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Design System Architectures
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              With AI Assistance
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            BuildWise helps you create professional system architecture diagrams with drag-and-drop
            simplicity, AI-powered suggestions, and guided learning for beginners.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:scale-105">
                Start Building Free →
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all">
                View Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose BuildWise?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3">Drag & Drop Design</h3>
            <p className="text-gray-600">
              Intuitive canvas with pre-built components. Design your architecture in minutes, not hours.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-3">AI-Powered Suggestions</h3>
            <p className="text-gray-600">
              Get instant architecture recommendations based on your requirements and best practices.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold mb-3">Student Mode</h3>
            <p className="text-gray-600">
              Step-by-step guided learning for beginners with explanations and skill-level-based templates.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">👨‍💼</div>
              <h4 className="font-semibold mb-2">Software Architects</h4>
              <p className="text-sm text-gray-600">Design scalable systems quickly</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">👨‍🎓</div>
              <h4 className="font-semibold mb-2">Students</h4>
              <p className="text-sm text-gray-600">Learn architecture patterns</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">👨‍💻</div>
              <h4 className="font-semibold mb-2">Developers</h4>
              <p className="text-sm text-gray-600">Plan projects visually</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">👨‍🏫</div>
              <h4 className="font-semibold mb-2">Educators</h4>
              <p className="text-sm text-gray-600">Teach system design concepts</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of architects and developers using BuildWise
          </p>
          <Link href="/register">
            <button className="px-10 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:scale-105 transition-all shadow-lg">
              Create Free Account →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600">
              © {new Date().getFullYear()} BuildWise. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
              <Link href="/terms" className="hover:text-blue-600">Terms</Link>
              <Link href="/contact" className="hover:text-blue-600">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
