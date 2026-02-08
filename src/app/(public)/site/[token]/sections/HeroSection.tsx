"use client";

import { ChevronDown } from "lucide-react";
import type { CmaSiteData } from "../types";

interface HeroSectionProps {
  data: CmaSiteData;
}

export function HeroSection({ data }: HeroSectionProps) {
  const { subjectProperty, pricing, reportTitle } = data;
  const heroImage = subjectProperty.images[0];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      {heroImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
      ) : (
        <div className="absolute inset-0 canva-gradient" />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <div data-animate className="mb-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium tracking-wide uppercase">
            Comparative Market Analysis
          </span>
        </div>

        <h1
          data-animate
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4"
        >
          {subjectProperty.streetAddress}
        </h1>

        <p data-animate className="text-lg sm:text-xl text-white/80 mb-8">
          {subjectProperty.city}, {subjectProperty.state}{" "}
          {subjectProperty.zip}
        </p>

        {/* Price Badge */}
        {pricing.suggestedPriceRaw && (
          <div data-animate className="inline-block mb-10">
            <div className="canva-gradient rounded-2xl px-8 py-4 shadow-2xl">
              <div className="text-sm font-medium text-white/80 uppercase tracking-wide">
                Recommended Price
              </div>
              <div className="text-3xl sm:text-4xl font-bold">
                {pricing.suggestedPrice}
              </div>
              {pricing.priceLowRaw && pricing.priceHighRaw && (
                <div className="text-sm text-white/70 mt-1">
                  Range: {pricing.priceLow} &ndash; {pricing.priceHigh}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div
          data-animate
          className="flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          {subjectProperty.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-white/60">Beds</span>
              <span className="font-semibold">{subjectProperty.bedrooms}</span>
            </span>
          )}
          {subjectProperty.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-white/60">Baths</span>
              <span className="font-semibold">
                {subjectProperty.bathrooms}
              </span>
            </span>
          )}
          {subjectProperty.sqft > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-white/60">Sqft</span>
              <span className="font-semibold">
                {subjectProperty.sqft.toLocaleString()}
              </span>
            </span>
          )}
          {subjectProperty.yearBuilt > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-white/60">Built</span>
              <span className="font-semibold">
                {subjectProperty.yearBuilt}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/60" />
      </div>
    </section>
  );
}
