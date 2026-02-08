"use client";

import type { CmaSiteData } from "../types";

interface NeighborhoodSectionProps {
  data: CmaSiteData;
}

function ScoreGauge({
  score,
  label,
  description,
}: {
  score: number;
  label: string;
  description?: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <div className="text-sm font-medium mt-2">{label}</div>
      {description && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      )}
    </div>
  );
}

export function NeighborhoodSection({ data }: NeighborhoodSectionProps) {
  const { neighborhood } = data;

  if (!neighborhood) return null;

  const hasScores =
    neighborhood.walkScore != null ||
    neighborhood.transitScore != null ||
    neighborhood.bikeScore != null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div data-animate className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Neighborhood
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Local amenities, scores, and demographics
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Walk/Transit/Bike Scores */}
          {hasScores && (
            <div
              data-animate
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="font-semibold mb-6 text-center">
                Livability Scores
              </h3>
              <div className="flex justify-center gap-6 flex-wrap">
                {neighborhood.walkScore != null && (
                  <ScoreGauge
                    score={neighborhood.walkScore}
                    label="Walk"
                    description={neighborhood.walkScoreDescription}
                  />
                )}
                {neighborhood.transitScore != null && (
                  <ScoreGauge
                    score={neighborhood.transitScore}
                    label="Transit"
                    description={neighborhood.transitScoreDescription}
                  />
                )}
                {neighborhood.bikeScore != null && (
                  <ScoreGauge
                    score={neighborhood.bikeScore}
                    label="Bike"
                    description={neighborhood.bikeScoreDescription}
                  />
                )}
              </div>
            </div>
          )}

          {/* Schools */}
          {neighborhood.schools && neighborhood.schools.length > 0 && (
            <div
              data-animate
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="font-semibold mb-4">Nearby Schools</h3>
              {neighborhood.avgSchoolRating != null && (
                <div className="mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {neighborhood.avgSchoolRating}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    /10 avg
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {neighborhood.schools.slice(0, 5).map((school, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 mr-2">
                      <div className="font-medium truncate">{school.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {school.type} &middot; {school.distance}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <div
                        className={`text-sm font-bold ${
                          school.rating >= 7
                            ? "text-green-600"
                            : school.rating >= 5
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {school.rating}/10
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demographics */}
          <div
            data-animate
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold mb-4">Demographics</h3>
            <div className="space-y-4">
              {neighborhood.medianHouseholdIncome != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Median Income
                  </span>
                  <span className="font-semibold">
                    ${neighborhood.medianHouseholdIncome.toLocaleString()}
                  </span>
                </div>
              )}
              {neighborhood.medianAge != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Median Age
                  </span>
                  <span className="font-semibold">
                    {neighborhood.medianAge}
                  </span>
                </div>
              )}
              {neighborhood.crimeIndex != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Crime Index
                  </span>
                  <span className="font-semibold">
                    {neighborhood.crimeIndex}
                    {neighborhood.crimeDescription && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({neighborhood.crimeDescription})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {neighborhood.populationDensity != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Population Density
                  </span>
                  <span className="font-semibold">
                    {neighborhood.populationDensity.toLocaleString()}/km&sup2;
                  </span>
                </div>
              )}
            </div>

            {/* Amenity Pills */}
            {neighborhood.amenities && neighborhood.amenities.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Nearby Amenities
                </div>
                <div className="flex flex-wrap gap-2">
                  {neighborhood.amenities.slice(0, 8).map((amenity, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
