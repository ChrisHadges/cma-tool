"use client";

import { useEffect, useRef, useState } from "react";
import type { CmaSiteData } from "../types";

interface PriceRecommendationSectionProps {
  data: CmaSiteData;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1500;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref}>
      {prefix}
      {display.toLocaleString()}
    </div>
  );
}

export function PriceRecommendationSection({
  data,
}: PriceRecommendationSectionProps) {
  const { pricing, comparables } = data;

  if (!pricing.suggestedPriceRaw) return null;

  const low = pricing.priceLowRaw || 0;
  const high = pricing.priceHighRaw || 0;
  const mid = pricing.suggestedPriceRaw || 0;
  const range = high - low || 1;
  const markerPosition = ((mid - low) / range) * 100;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <div data-animate className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Price Recommendation
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Based on {comparables.length} comparable sales with adjustments
          </p>
        </div>

        {/* Large Center Price */}
        <div data-animate className="mb-12">
          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">
            Suggested List Price
          </div>
          <div className="text-5xl sm:text-6xl font-bold canva-gradient-text">
            <AnimatedNumber value={mid} prefix="$" />
          </div>
        </div>

        {/* Price Range Bar */}
        <div data-animate className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            {/* Bar */}
            <div className="h-4 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400 overflow-hidden shadow-inner" />

            {/* Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${Math.min(Math.max(markerPosition, 5), 95)}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-lg border-3 border-purple-600 dark:border-purple-400" />
            </div>
          </div>

          {/* Range Labels */}
          <div className="flex justify-between mt-3 text-sm">
            <div className="text-left">
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                Low
              </div>
              <div className="font-semibold">{pricing.priceLow}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                High
              </div>
              <div className="font-semibold">{pricing.priceHigh}</div>
            </div>
          </div>
        </div>

        {/* Confidence Indicators */}
        <div
          data-animate
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div className="text-2xl font-bold">{comparables.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Comps Used
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div className="text-2xl font-bold">
              ${Math.round((high - low) / 1000)}k
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Price Spread
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div className="text-2xl font-bold">
              {mid && data.subjectProperty.sqft
                ? `$${Math.round(mid / data.subjectProperty.sqft)}`
                : "—"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Per Sq. Ft.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
