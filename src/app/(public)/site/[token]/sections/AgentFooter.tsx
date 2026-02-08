"use client";

import type { CmaSiteData } from "../types";

interface AgentFooterProps {
  data: CmaSiteData;
}

export function AgentFooter({ data }: AgentFooterProps) {
  const { agent, reportTitle, publishedAt } = data;

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="canva-gradient py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Agent Info */}
          {agent && (
            <div data-animate className="mb-8">
              {/* Avatar */}
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-3 border-white/30 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-4 border-3 border-white/30 bg-white/20 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-1">{agent.name}</h3>
              {agent.brokerage && (
                <p className="text-white/80 text-sm mb-3">
                  {agent.brokerage}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-white/70">
                {agent.email && <span>{agent.email}</span>}
                {agent.phone && <span>{agent.phone}</span>}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="w-16 h-px bg-white/20 mx-auto mb-6" />

          {/* Report Info */}
          <div data-animate className="text-sm text-white/50">
            <p className="mb-1">{reportTitle}</p>
            {publishedAt && (
              <p>
                Published{" "}
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Watermark */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/30">
              Prepared with CMA Tool &middot; Powered by Canva
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
