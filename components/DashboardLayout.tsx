// src/components/layout/DashboardLayout.tsx
"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, FolderOpen, Search, Trophy } from "lucide-react";

function NavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
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
    >
      <Icon className="h-4 w-4 text-zinc-500" />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white">
        <div className="px-6 py-6">
          <div className="text-2xl font-bold tracking-tight text-zinc-900">
            BuildWise
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          <NavItem href="/" label="Home" Icon={Home} />
          <NavItem href="/student" label="Student Mode" Icon={GraduationCap} />
          <NavItem href="/continue" label="Continue Work" Icon={FolderOpen} />
          <NavItem href="/samples" label="View Samples" Icon={Search} />
          <NavItem href="/leaderboard" label="Leaderboard" Icon={Trophy} />
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
