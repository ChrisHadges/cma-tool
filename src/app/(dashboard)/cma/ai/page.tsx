"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Home,
  MapPin,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Bot,
  User,
  FileText,
  Download,
  Palette,
  Globe,
  ExternalLink,
  ArrowRight,
  Copy,
  Check,
  BedDouble,
  Bath,
  Ruler,
  Building2,
} from "lucide-react";
import { CanvaTemplatePicker } from "@/components/canva-template-picker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CmaProgress {
  subjectProperty: boolean;
  comparables: boolean;
  adjustments: boolean;
  pricing: boolean;
  reportCreated: boolean;
  reportId: number | null;
  // Store data for report creation
  subjectData: Record<string, unknown> | null;
  compsData: Record<string, unknown>[] | null;
  analysisResult: Record<string, unknown> | null;
}

interface FeaturedProperty {
  mlsNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  listPrice: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  image: string | null;
}

export default function AiCmaBuilderPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI CMA assistant. Enter an MLS number or property address and I'll build your CMA automatically.\n\nOr pick one of the suggested properties below to get started!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CmaProgress>({
    subjectProperty: false,
    comparables: false,
    adjustments: false,
    pricing: false,
    reportCreated: false,
    reportId: null,
    subjectData: null,
    compsData: null,
    analysisResult: null,
  });
  const [featuredProperties, setFeaturedProperties] = useState<
    FeaturedProperty[]
  >([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [publishAction, setPublishAction] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch featured properties on mount
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/properties/featured");
        if (res.ok) {
          const data = await res.json();
          setFeaturedProperties(data.listings || []);
        }
      } catch {
        // Non-critical, just show empty
      } finally {
        setLoadingFeatured(false);
      }
    }
    fetchFeatured();
  }, []);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  // ─── Helper: format listing data for display ──────────────────
  const formatListingInfo = (listing: Record<string, unknown>) => {
    const addr = listing.address as Record<string, string> | undefined;
    const details = listing.details as Record<string, unknown> | undefined;

    const streetAddress = addr
      ? [addr.streetNumber, addr.streetName, addr.streetSuffix].filter(Boolean).join(" ")
      : (listing.streetAddress as string) || "Unknown";
    const city = addr?.city || (listing.city as string) || "";
    const state = addr?.state || (listing.state as string) || "";
    const beds = details?.numBedrooms || listing.bedrooms || "?";
    const baths = details?.numBathrooms || listing.bathrooms || "?";
    const sqft = details?.sqft || listing.sqft || "?";
    const price = listing.listPrice || listing.price;
    const yearBuilt = details?.yearBuilt || listing.yearBuilt || "?";
    const propType = details?.propertyType || listing.propertyType || "Residential";

    return { streetAddress, city, state, beds, baths, sqft, price, yearBuilt, propType };
  };

  // ─── Helper: build subject property data for DB ───────────────
  const buildSubjectData = (listing: Record<string, unknown>) => {
    const addr = listing.address as Record<string, string> | undefined;
    const details = listing.details as Record<string, unknown> | undefined;
    const mapData = listing.map as Record<string, number> | undefined;
    const images = listing.images as string[] | undefined;

    return {
      mlsNumber: listing.mlsNumber as string,
      streetAddress: addr
        ? [addr.streetNumber, addr.streetName, addr.streetSuffix].filter(Boolean).join(" ")
        : "Unknown",
      city: addr?.city || "",
      state: addr?.state || "ON",
      zip: addr?.zip || "00000",
      country: "CA",
      latitude: mapData?.latitude,
      longitude: mapData?.longitude,
      propertyType: details?.propertyType as string | undefined,
      style: details?.style as string | undefined,
      bedrooms: details?.numBedrooms as number | undefined,
      bedroomsPlus: details?.numBedroomsPlus as number | undefined,
      bathrooms: details?.numBathrooms as number | undefined,
      bathroomsHalf: details?.numBathroomsHalf as number | undefined,
      sqft: typeof details?.sqft === "string" ? parseInt(details.sqft, 10) || undefined : details?.sqft as number | undefined,
      yearBuilt: typeof details?.yearBuilt === "string" ? parseInt(details.yearBuilt, 10) || undefined : details?.yearBuilt as number | undefined,
      garage: details?.garage as string | undefined,
      garageSpaces: listing.numGarageSpaces as number | undefined,
      basement: details?.basement1 as string | undefined,
      heating: details?.heating as string | undefined,
      cooling: details?.airConditioning as string | undefined,
      pool: details?.swimmingPool as string | undefined,
      listPrice: listing.listPrice ? Number(listing.listPrice) : undefined,
      taxesAnnual: (listing.taxes as Record<string, number> | undefined)?.annualAmount,
      daysOnMarket: listing.daysOnMarket as number | undefined,
      description: details?.description as string | undefined,
      images: images || [],
    };
  };

  // ─── Helper: build comp data for DB ───────────────────────────
  const buildCompData = (listing: Record<string, unknown>) => {
    const addr = listing.address as Record<string, string> | undefined;
    const details = listing.details as Record<string, unknown> | undefined;
    const mapData = listing.map as Record<string, number> | undefined;
    const images = listing.images as string[] | undefined;

    return {
      mlsNumber: listing.mlsNumber as string,
      streetAddress: addr
        ? [addr.streetNumber, addr.streetName, addr.streetSuffix].filter(Boolean).join(" ")
        : "Unknown",
      city: addr?.city || "",
      state: addr?.state || "ON",
      zip: addr?.zip || "00000",
      latitude: mapData?.latitude,
      longitude: mapData?.longitude,
      propertyType: details?.propertyType as string | undefined,
      style: details?.style as string | undefined,
      bedrooms: details?.numBedrooms as number | undefined,
      bedroomsPlus: details?.numBedroomsPlus as number | undefined,
      bathrooms: details?.numBathrooms as number | undefined,
      bathroomsHalf: details?.numBathroomsHalf as number | undefined,
      sqft: typeof details?.sqft === "string" ? parseInt(details.sqft, 10) || undefined : details?.sqft as number | undefined,
      yearBuilt: typeof details?.yearBuilt === "string" ? parseInt(details.yearBuilt, 10) || undefined : details?.yearBuilt as number | undefined,
      garage: details?.garage as string | undefined,
      garageSpaces: listing.numGarageSpaces as number | undefined,
      basement: details?.basement1 as string | undefined,
      heating: details?.heating as string | undefined,
      cooling: details?.airConditioning as string | undefined,
      pool: details?.swimmingPool as string | undefined,
      soldPrice: listing.soldPrice ? Number(listing.soldPrice) : undefined,
      listPrice: listing.listPrice ? Number(listing.listPrice) : undefined,
      soldDate: listing.soldDate as string | undefined,
      daysOnMarket: listing.daysOnMarket as number | undefined,
      images: images || [],
    };
  };

  // ─── Main conversation processing ─────────────────────────────
  const processUserMessage = async (userMessage: string) => {
    setIsProcessing(true);

    try {
      // ── Step 1: Subject Property Lookup ──────────────────────
      const mlsMatch = userMessage.match(/(?:MLS\s*#?\s*)?([A-Z]{1,4}\d{5,10})/i);

      if (mlsMatch && !progress.subjectProperty) {
        const mlsNumber = mlsMatch[1].toUpperCase();
        addMessage("assistant", `🔍 Looking up MLS# ${mlsNumber}...`);

        try {
          const res = await fetch(`/api/properties/${mlsNumber}`);
          if (res.ok) {
            const listing = await res.json();
            const info = formatListingInfo(listing);
            const subjectData = buildSubjectData(listing);

            setProgress((p) => ({ ...p, subjectProperty: true, subjectData }));

            addMessage(
              "assistant",
              `✅ Found it!\n\n**${info.streetAddress}, ${info.city}, ${info.state}**\n- ${info.beds} Bed / ${info.baths} Bath / ${typeof info.sqft === "number" ? info.sqft.toLocaleString() : info.sqft} sqft\n- ${info.propType} • Built ${info.yearBuilt}\n- List Price: ${info.price ? `$${Number(info.price).toLocaleString()}` : "N/A"}\n\nSearching for comparable sold properties nearby...`
            );

            // ── Auto-advance: Find Comps ──────────────────────
            await findComparables(mlsNumber, subjectData);
          } else {
            addMessage(
              "assistant",
              `I couldn't find MLS# ${mlsNumber}. Try a different MLS number or enter the full property address.`
            );
          }
        } catch {
          addMessage(
            "assistant",
            "I had trouble connecting to the property database. Please try again or enter a property address instead."
          );
        }
      } else if (
        !progress.subjectProperty &&
        userMessage.match(/\d+\s+\w+/i)
      ) {
        // ── Address search ────────────────────────────────────
        addMessage("assistant", "🔍 Searching for properties matching your address...");

        try {
          const params = new URLSearchParams({
            search: userMessage,
            resultsPerPage: "5",
            status: "A",
          });
          const res = await fetch(`/api/properties/search?${params}`);
          if (res.ok) {
            const data = await res.json();
            const listings = data.listings || [];

            if (listings.length > 0) {
              let response = `Found ${listings.length} matching properties:\n\n`;
              listings.forEach((l: Record<string, unknown>, i: number) => {
                const info = formatListingInfo(l);
                response += `**${i + 1}.** ${info.streetAddress}, ${info.city}`;
                if (info.price) response += ` — $${Number(info.price).toLocaleString()}`;
                response += ` (MLS# ${l.mlsNumber})\n`;
              });
              response +=
                "\nReply with the MLS number to select your subject property.";
              addMessage("assistant", response);
            } else {
              addMessage(
                "assistant",
                "No matching properties found. Try entering an MLS number directly (e.g., \"C8147018\")."
              );
            }
          } else {
            addMessage(
              "assistant",
              "The search didn't return results. Try an MLS number instead."
            );
          }
        } catch {
          addMessage(
            "assistant",
            "I had trouble searching. Please try an MLS number instead."
          );
        }
      } else if (
        progress.reportCreated &&
        (userMessage.toLowerCase().includes("view") ||
          userMessage.toLowerCase().includes("report") ||
          userMessage.toLowerCase().includes("take me"))
      ) {
        addMessage("assistant", "Taking you to your report now...");
        if (progress.reportId) {
          router.push(`/cma/${progress.reportId}`);
        }
      } else if (!progress.subjectProperty) {
        addMessage(
          "assistant",
          "Enter an MLS number (e.g., \"C8147018\") or a property address to get started."
        );
      } else {
        addMessage(
          "assistant",
          "I'm working on your CMA. If you need to start over with a different property, click **Start over** in the sidebar."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Auto-step: Find comparables ──────────────────────────────
  const findComparables = async (
    mlsNumber: string,
    subjectData: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/properties/${mlsNumber}/similar`);
      if (res.ok) {
        const data = await res.json();
        const listings = data.listings || [];

        // Take the top 4 most relevant comps
        const topComps = listings.slice(0, 4);

        if (topComps.length > 0) {
          const compsData = topComps.map((l: Record<string, unknown>) => buildCompData(l));

          let compSummary = `📊 Found ${listings.length} comparable sold properties. Using the top ${topComps.length}:\n\n`;
          topComps.forEach((l: Record<string, unknown>, i: number) => {
            const info = formatListingInfo(l);
            const soldPrice = l.soldPrice ? `$${Number(l.soldPrice).toLocaleString()}` : "N/A";
            compSummary += `**${i + 1}.** ${info.streetAddress}, ${info.city} — Sold: ${soldPrice}\n`;
            compSummary += `   ${info.beds} Bed / ${info.baths} Bath / ${typeof info.sqft === "number" ? info.sqft.toLocaleString() : info.sqft} sqft\n`;
          });
          compSummary += "\nCreating your CMA report and running analysis...";

          setProgress((p) => ({ ...p, comparables: true, compsData }));
          addMessage("assistant", compSummary);

          // ── Auto-advance: Create report + calculate ─────────
          await createReportAndCalculate(subjectData, compsData);
        } else {
          setProgress((p) => ({ ...p, comparables: true, compsData: [] }));
          addMessage(
            "assistant",
            "I couldn't find enough comparable sold properties nearby. You can create the report and manually add comps from the report page.\n\nWould you like me to create the report anyway? Type **\"create report\"**."
          );
        }
      } else {
        addMessage(
          "assistant",
          "I had trouble finding comparable properties. You can create the report and add comps manually from the report page.\n\nType **\"create report\"** to proceed."
        );
      }
    } catch {
      addMessage(
        "assistant",
        "Error searching for comparables. Type **\"create report\"** to create the report without comps."
      );
    }
  };

  // ─── Auto-step: Create report + run calculation ───────────────
  const createReportAndCalculate = async (
    subjectData: Record<string, unknown>,
    compsData: Record<string, unknown>[]
  ) => {
    try {
      // Create CMA report via POST /api/cma
      const createRes = await fetch("/api/cma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectProperty: subjectData,
          comparables: compsData,
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create report");
      }

      const { id: reportId } = await createRes.json();

      // Run CMA calculation
      const calcRes = await fetch(`/api/cma/${reportId}/calculate`, {
        method: "POST",
      });

      if (calcRes.ok) {
        const result = await calcRes.json();
        const priceLow = result.priceRecommendation?.low;
        const priceMid = result.priceRecommendation?.mid;
        const priceHigh = result.priceRecommendation?.high;

        setProgress((p) => ({
          ...p,
          adjustments: true,
          pricing: true,
          reportCreated: true,
          reportId,
          analysisResult: result,
        }));

        addMessage(
          "assistant",
          `✅ CMA report created!\n\n**Recommended Price Range:**\n- Low: $${priceLow ? Number(priceLow).toLocaleString() : "N/A"}\n- **Recommended: $${priceMid ? Number(priceMid).toLocaleString() : "N/A"}**\n- High: $${priceHigh ? Number(priceHigh).toLocaleString() : "N/A"}\n\nBased on ${compsData.length} comparable sales with adjustments for size, age, location, and features.\n\nChoose how to share your report below:`
        );
      } else {
        // Report created but calc failed
        setProgress((p) => ({
          ...p,
          reportCreated: true,
          reportId,
        }));

        addMessage(
          "assistant",
          `✅ CMA report created! I wasn't able to auto-calculate the analysis — you may need to select exactly 4 comps on the report page.\n\nYou can still publish your report using the options below:`
        );
      }
    } catch (error) {
      console.error("Create report error:", error);
      addMessage(
        "assistant",
        "I had trouble creating the report. Please try again or create it manually from the dashboard."
      );
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    addMessage("user", trimmed);
    setInput("");
    processUserMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectFeatured = (property: FeaturedProperty) => {
    const msg = `MLS ${property.mlsNumber}`;
    addMessage("user", msg);
    processUserMessage(msg);
  };

  const handleDownloadPdf = async () => {
    if (!progress.reportId) return;
    setPublishAction("pdf");
    try {
      const res = await fetch(`/api/cma/${progress.reportId}/pdf`, {
        method: "POST",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CMA-Report-${progress.reportId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Handle error silently
    } finally {
      setPublishAction(null);
    }
  };

  const handleCreateCanva = async () => {
    if (!progress.reportId) return;

    try {
      const statusRes = await fetch("/api/canva/status");
      const statusData = await statusRes.json();

      if (!statusData.connected) {
        window.location.href = `/api/canva/auth?returnTo=/cma/ai`;
        return;
      }

      // Connected — open template picker
      setShowTemplatePicker(true);
    } catch {
      window.location.href = `/api/canva/auth?returnTo=/cma/ai`;
    }
  };

  const handleCreateWebsite = async () => {
    if (!progress.reportId) return;
    setPublishAction("website");
    try {
      const res = await fetch(`/api/cma/${progress.reportId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setWebsiteUrl(data.siteUrl);
      }
    } catch {
      // Handle error silently
    } finally {
      setPublishAction(null);
    }
  };

  const handleCopyUrl = () => {
    if (websiteUrl) {
      navigator.clipboard.writeText(websiteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl canva-gradient">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI CMA Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter a property and get a complete CMA in seconds
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg canva-gradient">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong key={i}>
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {/* Featured Properties — shown only at start */}
            {!progress.subjectProperty &&
              messages.length <= 2 &&
              !isProcessing && (
                <div className="px-11">
                  {loadingFeatured ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading suggested properties...
                    </div>
                  ) : featuredProperties.length > 0 ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                        Suggested Properties
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {featuredProperties.map((property) => (
                          <button
                            key={property.mlsNumber}
                            onClick={() => handleSelectFeatured(property)}
                            className="text-left bg-white dark:bg-gray-800 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all overflow-hidden group"
                          >
                            {/* Thumbnail */}
                            {property.image ? (
                              <div className="relative w-full h-28 overflow-hidden">
                                <img
                                  src={property.image}
                                  alt={property.streetAddress}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-white/90 backdrop-blur-sm">
                                    {property.propertyType}
                                  </Badge>
                                </div>
                                {property.listPrice && (
                                  <div className="absolute bottom-2 left-2">
                                    <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                                      ${Number(property.listPrice).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="relative w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <div className="absolute top-2 left-2">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                    {property.propertyType}
                                  </Badge>
                                </div>
                                {property.listPrice && (
                                  <div className="absolute bottom-2 left-2">
                                    <span className="text-xs font-bold text-foreground bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                                      ${Number(property.listPrice).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-3">
                              <div className="font-medium text-xs truncate mb-0.5">
                                {property.streetAddress}
                              </div>
                              <div className="text-[11px] text-muted-foreground mb-2">
                                {property.city}, {property.state} • MLS# {property.mlsNumber}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {property.bedrooms > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <BedDouble className="h-3 w-3" />
                                    {property.bedrooms}
                                  </span>
                                )}
                                {property.bathrooms > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Bath className="h-3 w-3" />
                                    {property.bathrooms}
                                  </span>
                                )}
                                {property.sqft > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Ruler className="h-3 w-3" />
                                    {property.sqft.toLocaleString()} ft²
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Create CMA
                                <ArrowRight className="h-3 w-3" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

            {/* Publish Options — shown after report is created */}
            {progress.reportCreated && progress.reportId && (
              <div className="px-11">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PDF Download */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={publishAction === "pdf"}
                    className="text-left bg-white dark:bg-gray-800 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all p-4 group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                      {publishAction === "pdf" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      Download PDF
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Client-ready PDF report
                    </p>
                  </button>

                  {/* Create in Canva */}
                  <button
                    onClick={handleCreateCanva}
                    disabled={publishAction === "canva"}
                    className="text-left bg-white dark:bg-gray-800 rounded-xl border border-border hover:border-purple-400 hover:shadow-md transition-all p-4 overflow-hidden relative group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 canva-gradient" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg canva-gradient mb-3">
                      {publishAction === "canva" ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Palette className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      Create in Canva
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Editable Canva presentation
                    </p>
                  </button>

                  {/* Create Website */}
                  <button
                    onClick={handleCreateWebsite}
                    disabled={publishAction === "website" || websiteUrl !== null}
                    className="text-left bg-white dark:bg-gray-800 rounded-xl border border-border hover:border-emerald-400 hover:shadow-md transition-all p-4 overflow-hidden relative group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 mb-3">
                      {publishAction === "website" ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Globe className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      {websiteUrl ? "Website Published!" : "Create Website"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {websiteUrl ? "Shareable link ready" : "Beautiful shareable website"}
                    </p>
                    {websiteUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl();
                          }}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          {copiedUrl ? (
                            <>
                              <Check className="h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy URL
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(websiteUrl, "_blank");
                          }}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Open
                        </button>
                      </div>
                    )}
                  </button>
                </div>

                {/* View Full Report Button */}
                <div className="mt-4 text-center">
                  <Link href={`/cma/${progress.reportId}`}>
                    <Button variant="outline" className="rounded-xl">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      View Full Report
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg canva-gradient">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 pt-2 border-t">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  progress.reportCreated
                    ? "Type \"view report\" to see your CMA..."
                    : "Enter MLS number or property address..."
                }
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                size="icon"
                className="h-[46px] w-[46px] rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <Card className="sticky top-0">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm">CMA Progress</h3>

              <div className="space-y-3">
                <ProgressStep
                  icon={Home}
                  label="Subject Property"
                  done={progress.subjectProperty}
                  active={!progress.subjectProperty}
                />
                <ProgressStep
                  icon={MapPin}
                  label="Find Comparables"
                  done={progress.comparables}
                  active={progress.subjectProperty && !progress.comparables}
                />
                <ProgressStep
                  icon={BarChart3}
                  label="Run Analysis"
                  done={progress.adjustments}
                  active={progress.comparables && !progress.adjustments}
                />
                <ProgressStep
                  icon={DollarSign}
                  label="Price Recommendation"
                  done={progress.pricing}
                  active={progress.adjustments && !progress.pricing}
                />
                <ProgressStep
                  icon={CheckCircle2}
                  label="Report Created"
                  done={progress.reportCreated}
                  active={progress.pricing && !progress.reportCreated}
                />
              </div>

              {progress.reportCreated && progress.reportId && (
                <div className="pt-2 space-y-2">
                  <Link href={`/cma/${progress.reportId}`}>
                    <Button className="w-full" size="sm">
                      View Report
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={publishAction === "pdf"}
                  >
                    {publishAction === "pdf" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full canva-gradient border-0 text-white hover:opacity-90"
                    size="sm"
                    onClick={handleCreateCanva}
                    disabled={publishAction === "canva"}
                  >
                    {publishAction === "canva" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Palette className="h-4 w-4 mr-1" />
                    )}
                    Create in Canva
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white hover:opacity-90"
                    size="sm"
                    onClick={handleCreateWebsite}
                    disabled={publishAction === "website" || websiteUrl !== null}
                  >
                    {publishAction === "website" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : websiteUrl ? (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : (
                      <Globe className="h-4 w-4 mr-1" />
                    )}
                    {websiteUrl ? "Published!" : "Create Website"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardContent className="pt-6 space-y-2">
              <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
              {!progress.subjectProperty && (
                <QuickAction
                  label="Search by MLS#"
                  onClick={() => {
                    setInput("MLS ");
                    inputRef.current?.focus();
                  }}
                />
              )}
              {progress.reportCreated && progress.reportId && (
                <QuickAction
                  label="View full report"
                  onClick={() => router.push(`/cma/${progress.reportId}`)}
                />
              )}
              <QuickAction
                label="Start over"
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-reset",
                      role: "assistant",
                      content:
                        "Let's start fresh! Enter an MLS number or property address.",
                      timestamp: new Date(),
                    },
                  ]);
                  setProgress({
                    subjectProperty: false,
                    comparables: false,
                    adjustments: false,
                    pricing: false,
                    reportCreated: false,
                    reportId: null,
                    subjectData: null,
                    compsData: null,
                    analysisResult: null,
                  });
                  setWebsiteUrl(null);
                  setPublishAction(null);
                  setLoadingFeatured(true);
                  fetch("/api/properties/featured")
                    .then((res) => res.json())
                    .then((data) => setFeaturedProperties(data.listings || []))
                    .catch(() => {})
                    .finally(() => setLoadingFeatured(false));
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canva Template Picker Modal */}
      {progress.reportId && (
        <CanvaTemplatePicker
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          reportId={progress.reportId}
          onDesignCreated={(design) => {
            addMessage(
              "assistant",
              `✅ Your Canva design "${design.title}" has been created! It's now open in a new tab.`
            );
          }}
        />
      )}
    </div>
  );
}

function ProgressStep({
  icon: Icon,
  label,
  done,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 text-sm ${
        done
          ? "text-green-600"
          : active
          ? "text-foreground font-medium"
          : "text-muted-foreground"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          done
            ? "bg-green-100"
            : active
            ? "bg-primary/10"
            : "bg-muted"
        }`}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}

function QuickAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
    </button>
  );
}
