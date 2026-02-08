"use client";

import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import type { CmaSiteData } from "../types";

interface ComparablesSectionProps {
  data: CmaSiteData;
}

export function ComparablesSection({ data }: ComparablesSectionProps) {
  const { comparables } = data;

  if (comparables.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div data-animate className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Comparable Sales
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {comparables.length} recently sold properties used in this analysis
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          data-animate
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
        >
          {comparables.map((comp) => (
            <div
              key={comp.number}
              className="shrink-0 w-80 snap-start bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Image / Header */}
              {comp.images && comp.images.length > 0 ? (
                <img
                  src={comp.images[0]}
                  alt={comp.address}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-24 canva-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    Comp #{comp.number}
                  </span>
                </div>
              )}

              <div className="p-5">
                {/* Address */}
                <h3 className="font-semibold text-sm mb-1 truncate">
                  {comp.address}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {comp.fullAddress}
                </p>

                {/* Price Info */}
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Sold Price
                    </div>
                    <div className="text-lg font-bold">{comp.soldPrice}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Adjusted
                    </div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {comp.adjustedPrice}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mb-3">
                  {comp.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {comp.bedrooms}
                    </span>
                  )}
                  {comp.bathrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {comp.bathrooms}
                    </span>
                  )}
                  {comp.sqft > 0 && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {comp.sqft.toLocaleString()}
                    </span>
                  )}
                  {comp.distanceKm !== "N/A" && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {comp.distanceKm}km
                    </span>
                  )}
                </div>

                {/* Sold Date & Adjustment */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">
                    Sold {comp.soldDate}
                  </span>
                  <span
                    className={`font-medium ${
                      comp.totalAdjustment.startsWith("-")
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    Adj: {comp.totalAdjustment}
                  </span>
                </div>

                {/* Top Adjustments */}
                {comp.adjustments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Key Adjustments
                    </div>
                    <div className="space-y-1">
                      {comp.adjustments.slice(0, 3).map((adj, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-gray-600 dark:text-gray-300">
                            {adj.label}
                          </span>
                          <span
                            className={`font-medium ${
                              adj.amountRaw < 0
                                ? "text-red-500"
                                : "text-green-600"
                            }`}
                          >
                            {adj.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
