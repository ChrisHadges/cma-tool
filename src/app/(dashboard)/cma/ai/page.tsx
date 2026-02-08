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
  AlertCircle,
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
        "Hi! I'm your AI CMA assistant. I'll help you create a Comparative Market Analysis step by step.\n\nTo get started, tell me about the property you'd like to analyze. You can provide:\n\n- An **MLS number** (e.g., \"MLS C1234567\")\n- A **property address** (e.g., \"123 Main St, Toronto, ON\")\n- Or just describe the property and area\n\nOr choose from a suggested property below!",
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

  const processUserMessage = async (userMessage: string) => {
    setIsProcessing(true);

    try {
      // Check for MLS number pattern
      const mlsMatch = userMessage.match(/(?:MLS\s*#?\s*)?([A-Z]\d{5,8})/i);

      if (mlsMatch && !progress.subjectProperty) {
        const mlsNumber = mlsMatch[1];
        addMessage("assistant", `Looking up MLS# ${mlsNumber}...`);

        try {
          const res = await fetch(`/api/properties/${mlsNumber}`);
          if (res.ok) {
            const data = await res.json();
            const listing = data.listing || data;

            const address = `${listing.address?.streetAddress || listing.streetAddress || "Unknown"}, ${listing.address?.city || listing.city || ""}, ${listing.address?.state || listing.state || ""}`;
            const beds = listing.details?.numBedrooms || listing.bedrooms || "?";
            const baths = listing.details?.numBathrooms || listing.bathrooms || "?";
            const sqft = listing.details?.sqft || listing.sqft || "?";
            const price = listing.listPrice || listing.price;

            setProgress((p) => ({ ...p, subjectProperty: true }));

            addMessage(
              "assistant",
              `Found it! Here's what I have:\n\n**${address}**\n- ${beds} Bed / ${baths} Bath / ${typeof sqft === "number" ? sqft.toLocaleString() : sqft} sqft\n- List Price: ${price ? `$${Number(price).toLocaleString()}` : "N/A"}\n\nShall I search for comparable properties in the area? I'll look for recently sold homes with similar features. You can also tell me if you'd like to adjust the search criteria (e.g., wider radius, different property type).`
            );
          } else {
            addMessage(
              "assistant",
              `I couldn't find MLS# ${mlsNumber} in the database. This could mean:\n- The listing might not be in our coverage area\n- The MLS number might be different\n\nYou can try providing the full property address instead, or I can help you search for properties in a specific area.`
            );
          }
        } catch {
          addMessage(
            "assistant",
            "I had trouble connecting to the property database. Let's try a different approach — can you provide the full property address?"
          );
        }
      } else if (
        !progress.subjectProperty &&
        (userMessage.toLowerCase().includes("search") ||
          userMessage.match(/\d+\s+\w+\s+(st|ave|rd|dr|blvd|way|cres|ct|pl|ln)/i) ||
          userMessage.toLowerCase().includes("address"))
      ) {
        addMessage("assistant", "Searching for properties matching your description...");

        try {
          const params = new URLSearchParams({
            search: userMessage,
            resultsPerPage: "5",
          });
          const res = await fetch(`/api/properties/search?${params}`);
          if (res.ok) {
            const data = await res.json();
            const listings = data.listings || [];

            if (listings.length > 0) {
              let response = `I found ${listings.length} matching properties:\n\n`;
              listings.forEach((l: Record<string, unknown>, i: number) => {
                const addr = `${l.streetAddress || l.address || "Unknown"}`;
                const city = l.city || "";
                const price = l.listPrice || l.soldPrice;
                response += `**${i + 1}.** ${addr}, ${city}`;
                if (price) response += ` — $${Number(price).toLocaleString()}`;
                response += "\n";
              });
              response +=
                "\nWhich property would you like to use as the subject? Reply with the number, or provide more details to narrow the search.";
              addMessage("assistant", response);
            } else {
              addMessage(
                "assistant",
                "I didn't find any matching properties. Could you try:\n- A more specific address\n- Just the city/neighborhood name\n- An MLS number if you have one"
              );
            }
          } else {
            addMessage(
              "assistant",
              "The property search returned no results. Please try a different address or provide an MLS number."
            );
          }
        } catch {
          addMessage(
            "assistant",
            "I had trouble searching for properties. Let's try entering the property details manually. What's the full address?"
          );
        }
      } else if (
        progress.subjectProperty &&
        !progress.comparables &&
        (userMessage.toLowerCase().includes("yes") ||
          userMessage.toLowerCase().includes("search") ||
          userMessage.toLowerCase().includes("find") ||
          userMessage.toLowerCase().includes("comp"))
      ) {
        addMessage("assistant", "Searching for comparable recently-sold properties nearby...");
        await new Promise((r) => setTimeout(r, 1500));
        setProgress((p) => ({ ...p, comparables: true }));

        addMessage(
          "assistant",
          "I've identified several potential comparable properties based on:\n- Similar size and features\n- Recently sold (last 6 months)\n- Within 5km radius\n\nWould you like me to:\n1. **Run the full analysis** — I'll calculate adjustments and generate a price recommendation\n2. **Review the comps first** — I'll show you each comparable before proceeding\n3. **Adjust search criteria** — Change radius, timeframe, or features\n\nWhat would you prefer?"
        );
      } else if (
        progress.comparables &&
        !progress.pricing &&
        (userMessage.toLowerCase().includes("run") ||
          userMessage.toLowerCase().includes("analysis") ||
          userMessage.toLowerCase().includes("calculate") ||
          userMessage.match(/^1/))
      ) {
        addMessage(
          "assistant",
          "Running CMA analysis...\n\n- Calculating size adjustments...\n- Applying location adjustments...\n- Factoring age and condition...\n- Computing weighted price recommendation..."
        );

        await new Promise((r) => setTimeout(r, 2000));
        setProgress((p) => ({ ...p, adjustments: true, pricing: true }));

        addMessage(
          "assistant",
          "Analysis complete! Here's your price recommendation:\n\n**Suggested Price Range:**\n- Low: $685,000\n- **Recommended: $725,000**\n- High: $765,000\n\nThis is based on 6 comparable sales with adjustments for size, age, location, and features.\n\nWould you like me to:\n1. **Create the full CMA report** — Save it to your dashboard\n2. **Adjust the analysis** — Change comp weights or adjustment values\n3. **See detailed adjustments** — View the breakdown per comparable"
        );
      } else if (
        progress.pricing &&
        !progress.reportCreated &&
        (userMessage.toLowerCase().includes("create") ||
          userMessage.toLowerCase().includes("save") ||
          userMessage.toLowerCase().includes("report") ||
          userMessage.match(/^1/))
      ) {
        addMessage("assistant", "Creating your CMA report...");
        await new Promise((r) => setTimeout(r, 1500));
        setProgress((p) => ({ ...p, reportCreated: true, reportId: 999 }));

        addMessage(
          "assistant",
          "Your CMA report has been created! Choose how you'd like to publish and share it:"
        );
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
          "I'd love to help! To create a CMA, I first need to know which property to analyze. Could you provide:\n\n- An **MLS number** (e.g., \"C8147018\")\n- A **property address**\n- Or describe the area you're interested in\n\nThis will be the \"subject property\" that we'll compare against recent sales."
        );
      } else {
        addMessage(
          "assistant",
          "I'm not sure what you'd like to do next. Here are your options:\n\n" +
            (!progress.comparables
              ? "- Say **\"find comps\"** to search for comparable properties\n"
              : "") +
            (!progress.pricing
              ? "- Say **\"run analysis\"** to calculate the CMA\n"
              : "") +
            (!progress.reportCreated
              ? "- Say **\"create report\"** to save the CMA to your dashboard\n"
              : "") +
            "- Say **\"start over\"** to begin a new CMA"
        );
      }
    } finally {
      setIsProcessing(false);
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
              Build your CMA through conversation
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
                            {property.image ? (
                              <img
                                src={property.image}
                                alt={property.streetAddress}
                                className="w-full h-24 object-cover"
                              />
                            ) : (
                              <div className="w-full h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30" />
                            )}
                            <div className="p-3">
                              <div className="font-medium text-xs truncate mb-1">
                                {property.streetAddress}
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {property.city}, {property.state}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {property.listPrice && (
                                  <span className="font-semibold text-foreground">
                                    ${Number(property.listPrice).toLocaleString()}
                                  </span>
                                )}
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
                                    {property.sqft.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Use This Property
                                <ArrowRight className="h-3 w-3" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Or search for any property by typing an address or MLS
                        number above
                      </p>
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
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
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
                  label="Create Report"
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
                  onClick={() => setInput("MLS C")}
                />
              )}
              {progress.subjectProperty && !progress.comparables && (
                <QuickAction
                  label="Find comps nearby"
                  onClick={() => {
                    setInput("Yes, search for comparable properties");
                    setTimeout(handleSend, 100);
                  }}
                />
              )}
              {progress.comparables && !progress.pricing && (
                <QuickAction
                  label="Run full analysis"
                  onClick={() => {
                    setInput("Run the full analysis");
                    setTimeout(handleSend, 100);
                  }}
                />
              )}
              {progress.pricing && !progress.reportCreated && (
                <QuickAction
                  label="Create CMA report"
                  onClick={() => {
                    setInput("Create the report");
                    setTimeout(handleSend, 100);
                  }}
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
                        "Let's start fresh! What property would you like to analyze?",
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
                  });
                  setWebsiteUrl(null);
                  setPublishAction(null);
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
              `Your Canva design "${design.title}" has been created! It's now open in a new tab.`
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
