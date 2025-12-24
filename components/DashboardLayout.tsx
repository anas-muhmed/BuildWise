// src/components/layout/DashboardLayout.tsx
"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FolderOpen, Search, Trophy, ChevronLeft, ChevronRight } from "lucide-react";

function NavItem({
  href,
  label,
  Icon,
  collapsed,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 text-zinc-500" />
      {!collapsed && label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-foreground">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 border-r border-zinc-200 bg-white ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="px-6 py-6 flex items-center justify-between">
          {!collapsed && (
            <div className="text-2xl font-bold tracking-tight text-zinc-900">
              BuildWise
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-600 hover:text-indigo-700 cursor-pointer transition-all shadow-sm hover:shadow-md"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          <NavItem href="/" label="Home" Icon={Home} collapsed={collapsed} />
          <NavItem href="/student" label="Student Mode" Icon={GraduationCap} collapsed={collapsed} />
          <NavItem href="/continue" label="Continue Work" Icon={FolderOpen} collapsed={collapsed} />
          <NavItem href="/samples" label="View Samples" Icon={Search} collapsed={collapsed} />
          <NavItem href="/leaderboard" label="Leaderboard" Icon={Trophy} collapsed={collapsed} />
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b bg-white px-6">
          <p className="text-sm text-zinc-600">Hello, Anas</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
