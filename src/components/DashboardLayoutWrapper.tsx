"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  BookOpen,
  History,
  Trophy,
  Settings,
  Search,
  Bell,
  Command,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

const NavItem = ({ icon, label, active, onClick, collapsed }: NavItemProps) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${
      active
        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white"
        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
    }`}
    title={collapsed ? label : undefined}
  >
    <div className="w-5 h-5">{icon}</div>
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
  </div>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNav?: "workspace" | "student" | "recent" | "leaderboard" | "teacher";
  breadcrumb?: string;
}

export default function DashboardLayoutWrapper({ 
  children, 
  activeNav = "workspace",
  breadcrumb = "Dashboard" 
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`transition-all duration-300 border-r border-zinc-800 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "/"}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold">BuildWise</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/20"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<LayoutGrid />} 
            label="Workspace" 
            active={activeNav === "workspace"}
            onClick={() => window.location.href = "/"}
            collapsed={collapsed}
          />
          <NavItem 
            icon={<BookOpen />} 
            label="Student Mode" 
            active={activeNav === "student"}
            onClick={() => window.location.href = "/student"}
            collapsed={collapsed}
          />
          <NavItem 
            icon={<History />} 
            label="Recent Work" 
            active={activeNav === "recent"}
            onClick={() => window.location.href = "/generative-ai-v2"}
            collapsed={collapsed}
          />
          <NavItem 
            icon={<Trophy />} 
            label="Leaderboard" 
            active={activeNav === "leaderboard"}
            onClick={() => alert("Leaderboard coming soon!")}
            collapsed={collapsed}
          />
        </div>

        {/* Settings & User */}
        <div className="p-4 border-t border-zinc-800 space-y-4">
          <NavItem icon={<Settings />} label="Settings" collapsed={collapsed} />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
            {!collapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">Safia</div>
                <div className="text-xs text-zinc-500">Student</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-white">{breadcrumb}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-12 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-700"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-600">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            {/* Notifications */}
            <button className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <Bell className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
