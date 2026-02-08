"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Settings,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Property Search", href: "/search", icon: Search },
  {
    name: "New CMA",
    href: "/cma/new",
    icon: PlusCircle,
    description: "Manual wizard",
  },
  {
    name: "AI CMA Builder",
    href: "/cma/ai",
    icon: MessageSquareText,
    description: "Conversational",
    badge: "AI",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="canva-gradient rounded-xl p-1.5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 12L10 30h6v20h32V30h6L32 12z"
                fill="white"
                fillOpacity="0.3"
              />
              <rect
                x="18"
                y="38"
                width="7"
                height="10"
                rx="1.5"
                fill="white"
              />
              <rect
                x="28.5"
                y="31"
                width="7"
                height="17"
                rx="1.5"
                fill="white"
              />
              <rect
                x="39"
                y="24"
                width="7"
                height="24"
                rx="1.5"
                fill="white"
              />
              <path
                d="M32 12L10 30h44L32 12z"
                fill="white"
                fillOpacity="0.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-base tracking-tight text-sidebar-foreground">
              Canva CMA
            </span>
            <span className="text-[10px] text-sidebar-foreground/50">
              Market Analysis Tool
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{item.name}</span>
              {"badge" in item && item.badge && (
                <span className="canva-gradient text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator + CMA Reports section */}
        <div className="pt-4 pb-2">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Quick Actions
          </p>
        </div>
        <Link
          href="/cma/new"
          className="flex items-center gap-3 mx-2 px-4 py-3 rounded-xl canva-gradient text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg shadow-primary/20"
        >
          <Sparkles className="w-4 h-4" />
          Create New CMA
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
            pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
