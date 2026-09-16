import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  LogOut,
  ChevronDown,
  Layers,
  FileText,
  Wand2,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { UserRole, ProgressiveDisclosureMode } from "@/types/editorialIntelligence";

export type PrimaryNavModule =
  | "analyze"
  | "bulk"
  | "humanize"
  | "editorial"
  | "newsroom"
  | "reports"
  | "settings";

interface EditorialHeaderProps {
  activeModule: PrimaryNavModule;
  onSelectModule: (mod: PrimaryNavModule) => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  disclosureMode: ProgressiveDisclosureMode;
  onChangeDisclosureMode: (mode: ProgressiveDisclosureMode) => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export function EditorialHeader({
  activeModule,
  onSelectModule,
  userRole,
  onChangeUserRole,
  disclosureMode,
  onChangeDisclosureMode,
  userEmail,
  onSignOut,
}: EditorialHeaderProps) {
  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    journalist: { label: "Journalist", badge: "bg-blue-900/60 text-blue-200 border-blue-700/50" },
    editor: { label: "Editor", badge: "bg-amber-900/60 text-amber-200 border-amber-700/50" },
    manager: { label: "Newsroom Manager", badge: "bg-purple-900/60 text-purple-200 border-purple-700/50" },
    admin: { label: "Administrator", badge: "bg-emerald-900/60 text-emerald-200 border-emerald-700/50" },
  };

  const navItems: { id: PrimaryNavModule; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "analyze", label: "Analyze", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "bulk", label: "Bulk Review", icon: <Layers className="w-3.5 h-3.5 text-amber-400" />, badge: "50+/hr" },
    { id: "humanize", label: "Humanize", icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: "editorial", label: "Editorial", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "newsroom", label: "Newsroom", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-[#0b2422] text-white border-b border-[#1b433e] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand & Platform Title */}
        <div className="flex items-center gap-4">
          <Link
            to="/newsroom"
            className="flex items-center gap-2.5 text-white hover:text-amber-300 transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded bg-[#134e48] border border-[#2dd4bf]/40 flex items-center justify-center text-amber-300 font-bold text-sm shadow-inner">
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-sm text-slate-100 font-sans">
                  Amaica Media
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#134e48] text-teal-200 border border-teal-700/60">
                  Editorial Intelligence
                </span>
              </div>
              <span className="text-[10px] text-teal-300/80 font-serif italic hidden sm:inline">
                Detect. Understand. Improve. Humanize. Publish.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Primary Navigation */}
        <nav aria-label="Editorial primary navigation" className="hidden md:flex items-center gap-1 bg-[#071a18] p-1 rounded-lg border border-[#1b433e]">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#115e59] text-amber-200 shadow-sm font-semibold border border-teal-500/40"
                    : "text-slate-300 hover:text-white hover:bg-[#0f3531]"
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="ml-0.5 px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono border border-amber-400/30 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Role Switcher + Progressive Disclosure + Auth */}
        <div className="flex items-center gap-2.5">
          {/* Progressive Disclosure Toggle */}
          <div className="hidden lg:flex items-center bg-[#071a18] p-0.5 rounded-md border border-[#1b433e] text-[11px]">
            <span className="px-2 py-0.5 text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-teal-400" />
              View:
            </span>
            {(["basic", "editor", "forensics"] as ProgressiveDisclosureMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeDisclosureMode(mode)}
                className={`px-2 py-0.5 rounded capitalize transition-all ${
                  disclosureMode === mode
                    ? "bg-[#134e48] text-amber-300 font-semibold border border-teal-600/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071a18] border border-[#1b433e] hover:border-teal-600/60 text-xs text-slate-200 transition-colors"
                title="Switch newsroom role for testing permissions"
              >
                <Users className="w-3 h-3 text-amber-400" />
                <span className="font-medium">{roleLabels[userRole].label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-800 text-slate-100 text-xs">
              <DropdownMenuLabel className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Simulate Newsroom Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={() => onChangeUserRole("journalist")}
                className={`cursor-pointer ${userRole === "journalist" ? "bg-slate-800 text-amber-300" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Journalist</span>
                  <span className="text-[10px] text-slate-400">Create, analyze, humanize, submit</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeUserRole("editor")}
                className={`cursor-pointer ${userRole === "editor" ? "bg-slate-800 text-amber-300" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Editor</span>
                  <span className="text-[10px] text-slate-400">Review, approve, edit, inspect evidence</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeUserRole("manager")}
                className={`cursor-pointer ${userRole === "manager" ? "bg-slate-800 text-amber-300" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Newsroom Manager</span>
                  <span className="text-[10px] text-slate-400">Executive reports, quality metrics</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeUserRole("admin")}
                className={`cursor-pointer ${userRole === "admin" ? "bg-slate-800 text-amber-300" : ""}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Administrator</span>
                  <span className="text-[10px] text-slate-400">Editorial rules, sensitivity settings</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Sign out */}
          {userEmail && onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#134e48] rounded transition-colors"
              title={`Signed in as ${userEmail}. Click to sign out.`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Secondary Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-1.5 bg-[#071a18] border-t border-[#1b433e] text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`px-2 py-1 rounded whitespace-nowrap text-[11px] ${
                activeModule === item.id
                  ? "bg-[#115e59] text-amber-200 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
