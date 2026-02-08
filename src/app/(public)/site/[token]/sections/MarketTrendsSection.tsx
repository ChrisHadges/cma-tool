"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CmaSiteData } from "../types";

interface MarketTrendsSectionProps {
  data: CmaSiteData;
}

export function MarketTrendsSection({ data }: MarketTrendsSectionProps) {
  const { marketSnapshots } = data;

  if (!marketSnapshots || marketSnapshots.length === 0) return null;

  const chartData = marketSnapshots
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((s) => ({
      period: s.period,
      avgPrice: s.avgPrice || 0,
      medianPrice: s.medianPrice || 0,
      soldCount: s.soldCount || 0,
      activeCount: s.activeCount || 0,
      avgDom: s.avgDom || 0,
    }));

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div data-animate className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Market Trends
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Historical market performance in the area
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Price Trend */}
          <div
            data-animate
            className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="font-semibold mb-4">Average Sold Price</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    fontSize={11}
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis
                    fontSize={11}
                    tick={{ fill: "#9ca3af" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Math.round(Number(value)).toLocaleString()}`,
                      "Avg Price",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPrice"
                    stroke="#7b2ff7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Volume */}
          <div
            data-animate
            className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="font-semibold mb-4">Sales Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="period"
                    fontSize={11}
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="soldCount"
                    name="Sold"
                    fill="#7b2ff7"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activeCount"
                    name="Active"
                    fill="#7b2ff740"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
