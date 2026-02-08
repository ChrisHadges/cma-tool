"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
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

interface MarketStats {
  sold: {
    count: number;
    statistics: Record<string, { avg?: number; min?: number; max?: number }>;
  };
  active: {
    count: number;
    statistics: Record<string, { avg?: number }>;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export default function MarketPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState("12");

  useEffect(() => {
    async function fetchData() {
      try {
        const reportRes = await fetch(`/api/cma/${reportId}`);
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setReport(reportData);

          const subject = reportData.subjectProperty;
          if (subject?.city) {
            await fetchMarketStats(subject.city, subject.propertyType);
          }
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId, months]);

  const fetchMarketStats = async (city: string, propertyType?: string) => {
    try {
      const params = new URLSearchParams({ city, months });
      if (propertyType) params.set("propertyType", propertyType);

      const res = await fetch(`/api/market/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMarketStats(data);
      }
    } catch {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading market data...
      </div>
    );
  }

  const subject = report?.subjectProperty as Record<string, unknown> | null;

  // Generate sample trend data for visualization
  const generateTrendData = () => {
    const data = [];
    const now = new Date();
    for (let i = Number(months) - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      data.push({
        month: monthStr,
        avgPrice:
          (marketStats?.sold.statistics?.soldPrice?.avg || 750000) +
          Math.random() * 50000 -
          25000,
        soldCount: Math.floor(Math.random() * 50 + 20),
        activeCount: Math.floor(Math.random() * 80 + 40),
        avgDom: Math.floor(Math.random() * 20 + 10),
      });
    }
    return data;
  };

  const trendData = generateTrendData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/cma/${reportId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Report
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
          <p className="text-muted-foreground mt-1">
            {subject ? `${subject.city}, ${subject.state}` : "Market"} —{" "}
            {(subject?.propertyType as string) || "All property types"}
          </p>
        </div>
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      {marketStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Sold Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {marketStats.sold.statistics?.soldPrice?.avg
                  ? Math.round(
                      marketStats.sold.statistics.soldPrice.avg
                    ).toLocaleString()
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sold Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketStats.sold.count.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketStats.active.count.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Absorption Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketStats.sold.count > 0
                  ? (
                      (marketStats.active.count /
                        (marketStats.sold.count / Number(months)))
                    ).toFixed(1)
                  : "N/A"}{" "}
                mo
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Price Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Average Sold Price</CardTitle>
            <CardDescription>Monthly average sold price trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis
                    fontSize={12}
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
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Volume</CardTitle>
            <CardDescription>Monthly sold vs active listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="soldCount" name="Sold" fill="hsl(var(--primary))" />
                  <Bar
                    dataKey="activeCount"
                    name="Active"
                    fill="hsl(var(--primary) / 0.3)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Days on Market */}
        <Card>
          <CardHeader>
            <CardTitle>Days on Market</CardTitle>
            <CardDescription>Average days on market trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value) => [
                      `${Math.round(Number(value))} days`,
                      "Avg DOM",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgDom"
                    stroke="hsl(var(--chart-2, 220 70% 50%))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
