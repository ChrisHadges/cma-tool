"use client";

import {
  BedDouble,
  Bath,
  Ruler,
  Calendar,
  Car,
  TreePine,
  Waves,
  Building2,
  DollarSign,
  Clock,
} from "lucide-react";
import type { CmaSiteData } from "../types";

interface PropertyDetailsSectionProps {
  data: CmaSiteData;
}

export function PropertyDetailsSection({ data }: PropertyDetailsSectionProps) {
  const { subjectProperty } = data;
  const images = subjectProperty.images || [];

  const specs = [
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: subjectProperty.bedrooms || "—",
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: subjectProperty.bathrooms || "—",
    },
    {
      icon: Ruler,
      label: "Sq. Ft.",
      value: subjectProperty.sqft
        ? subjectProperty.sqft.toLocaleString()
        : "—",
    },
    {
      icon: TreePine,
      label: "Lot Size",
      value: subjectProperty.lotSqft
        ? `${subjectProperty.lotSqft.toLocaleString()} sqft`
        : "—",
    },
    {
      icon: Calendar,
      label: "Year Built",
      value: subjectProperty.yearBuilt || "—",
    },
    {
      icon: Building2,
      label: "Type",
      value: subjectProperty.propertyType || "—",
    },
    {
      icon: Car,
      label: "Garage",
      value: subjectProperty.garage || "—",
    },
    {
      icon: DollarSign,
      label: "List Price",
      value: subjectProperty.listPrice,
    },
    {
      icon: Clock,
      label: "Days on Market",
      value: subjectProperty.daysOnMarket || "—",
    },
    ...(subjectProperty.pool && subjectProperty.pool !== "None"
      ? [{ icon: Waves, label: "Pool", value: subjectProperty.pool }]
      : []),
  ].filter((s) => s.value !== "—" && s.value !== 0 && s.value !== "N/A");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div data-animate className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Property Details
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {subjectProperty.address}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Photo Gallery */}
          <div data-animate>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Main image */}
                <div className="col-span-2">
                  <img
                    src={images[0]}
                    alt="Property"
                    className="w-full h-72 object-cover rounded-xl"
                  />
                </div>
                {/* Secondary images */}
                {images.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Property photo ${i + 2}`}
                    className="w-full h-36 object-cover rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                No photos available
              </div>
            )}
          </div>

          {/* Specs Grid */}
          <div data-animate>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30 shrink-0">
                    <spec.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {spec.label}
                    </div>
                    <div className="font-semibold text-sm">{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {subjectProperty.description && (
              <div className="mt-6 p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6">
                  {subjectProperty.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
