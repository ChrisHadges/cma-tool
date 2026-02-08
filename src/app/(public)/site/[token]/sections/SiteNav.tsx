"use client";

import { useEffect, useState } from "react";

interface SiteNavProps {
  address: string;
  agentName?: string;
}

export function SiteNav({ address, agentName }: SiteNavProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded-md canva-gradient flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-medium truncate">{address}</span>
          </div>
          {agentName && (
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Prepared by {agentName}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
