// src/components/layout/DashboardLayout.tsx
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 p-6">
  <h2 className="text-2xl font-bold text-zinc-800 mb-6 tracking-tight">
    BuildWise
  </h2>
  <nav className="flex flex-col gap-3">
    <button className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700">
      🏠 Home
    </button>
    <button className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700">
      🎓 Student Mode
    </button>
    <button className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700">
      📂 Continue Work
    </button>
    <button className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700">
      🔍 View Samples
    </button>
    <button className="text-left px-3 py-2 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700">
      🏆 Leaderboard
    </button>
  </nav>
</aside>


      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b flex items-center justify-end px-6">
          <p className="text-sm">Hello, Anas</p>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
