"use client";

import { useScrollAnimations } from "./hooks/useScrollAnimations";
import { SiteNav } from "./sections/SiteNav";
import { HeroSection } from "./sections/HeroSection";
import { PropertyDetailsSection } from "./sections/PropertyDetailsSection";
import { ComparablesSection } from "./sections/ComparablesSection";
import { PriceRecommendationSection } from "./sections/PriceRecommendationSection";
import { MarketTrendsSection } from "./sections/MarketTrendsSection";
import { NeighborhoodSection } from "./sections/NeighborhoodSection";
import { AgentFooter } from "./sections/AgentFooter";
import type { CmaSiteData } from "./types";

interface CmaSiteProps {
  data: CmaSiteData;
}

export function CmaSite({ data }: CmaSiteProps) {
  useScrollAnimations();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <SiteNav
        address={data.subjectProperty.address}
        agentName={data.agent?.name}
      />
      <HeroSection data={data} />
      <PropertyDetailsSection data={data} />
      <ComparablesSection data={data} />
      <PriceRecommendationSection data={data} />
      <MarketTrendsSection data={data} />
      <NeighborhoodSection data={data} />
      <AgentFooter data={data} />
    </div>
  );
}
