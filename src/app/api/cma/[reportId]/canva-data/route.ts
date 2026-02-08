import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cmaReports,
  subjectProperties,
  comparableProperties,
  adjustments,
  marketSnapshots,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchNeighborhoodData } from "@/lib/services/neighborhood";

/**
 * GET /api/cma/[reportId]/canva-data
 *
 * Returns all CMA report data formatted as a structured object
 * that can be used with the Canva MCP tools to generate a design.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);

    // Fetch report
    const [report] = await db
      .select()
      .from(cmaReports)
      .where(eq(cmaReports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Fetch subject property
    let subject = null;
    if (report.subjectPropertyId) {
      const [subj] = await db
        .select()
        .from(subjectProperties)
        .where(eq(subjectProperties.id, report.subjectPropertyId));
      subject = subj;
    }

    if (!subject) {
      return NextResponse.json(
        { error: "No subject property in this report" },
        { status: 400 }
      );
    }

    // Fetch comparables with adjustments
    const comps = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.cmaReportId, id));

    const compsWithAdjustments = await Promise.all(
      comps.map(async (comp) => {
        const adjs = await db
          .select()
          .from(adjustments)
          .where(eq(adjustments.comparableId, comp.id));
        return { ...comp, adjustments: adjs };
      })
    );

    // Fetch market snapshots
    const snapshots = await db
      .select()
      .from(marketSnapshots)
      .where(eq(marketSnapshots.cmaReportId, id));

    // Fetch neighborhood data
    let neighborhoodData = null;
    if (subject.latitude && subject.longitude) {
      try {
        neighborhoodData = await fetchNeighborhoodData(
          String(subject.latitude),
          String(subject.longitude),
          subject.zip || undefined
        );
      } catch {
        // Continue without neighborhood data
      }
    }

    // Format for Canva design
    const fullAddress = `${subject.streetAddress}, ${subject.city}, ${subject.state} ${subject.zip}`;

    const formattedComps = compsWithAdjustments.map((comp, idx) => ({
      number: idx + 1,
      address: comp.streetAddress,
      fullAddress: `${comp.streetAddress}, ${comp.city}, ${comp.state}`,
      soldPrice: comp.soldPrice ? `$${Number(comp.soldPrice).toLocaleString()}` : "N/A",
      soldPriceRaw: comp.soldPrice ? Number(comp.soldPrice) : null,
      adjustedPrice: comp.adjustedPrice
        ? `$${Number(comp.adjustedPrice).toLocaleString()}`
        : "N/A",
      adjustedPriceRaw: comp.adjustedPrice ? Number(comp.adjustedPrice) : null,
      soldDate: comp.soldDate
        ? new Date(comp.soldDate).toLocaleDateString("en-US")
        : "N/A",
      bedrooms: comp.bedrooms || 0,
      bathrooms: comp.bathrooms || 0,
      sqft: comp.sqft || 0,
      yearBuilt: comp.yearBuilt || 0,
      distanceKm: comp.distanceKm ? Number(comp.distanceKm).toFixed(1) : "N/A",
      totalAdjustment: comp.totalAdjustment
        ? `$${Number(comp.totalAdjustment).toLocaleString()}`
        : "$0",
      adjustments: comp.adjustments.map((adj) => ({
        category: adj.category,
        label: adj.label,
        subjectValue: adj.subjectValue,
        compValue: adj.compValue,
        amount: `$${Number(adj.adjustmentAmount).toLocaleString()}`,
      })),
    }));

    return NextResponse.json({
      reportTitle: report.title,
      status: report.status,
      createdAt: report.createdAt,

      subjectProperty: {
        address: fullAddress,
        streetAddress: subject.streetAddress,
        city: subject.city,
        state: subject.state,
        zip: subject.zip,
        propertyType: subject.propertyType || "Residential",
        style: subject.style || "",
        bedrooms: subject.bedrooms || 0,
        bathrooms: subject.bathrooms || 0,
        sqft: subject.sqft || 0,
        lotSqft: subject.lotSqft || 0,
        yearBuilt: subject.yearBuilt || 0,
        garage: subject.garage || "",
        garageSpaces: subject.garageSpaces || 0,
        basement: subject.basement || "",
        pool: subject.pool || "",
        listPrice: subject.listPrice
          ? `$${Number(subject.listPrice).toLocaleString()}`
          : "N/A",
        listPriceRaw: subject.listPrice ? Number(subject.listPrice) : null,
        daysOnMarket: subject.daysOnMarket || 0,
        images: subject.images || [],
      },

      pricing: {
        suggestedPrice: report.priceMid
          ? `$${Number(report.priceMid).toLocaleString()}`
          : "N/A",
        priceLow: report.priceLow
          ? `$${Number(report.priceLow).toLocaleString()}`
          : "N/A",
        priceHigh: report.priceHigh
          ? `$${Number(report.priceHigh).toLocaleString()}`
          : "N/A",
        suggestedPriceRaw: report.priceMid ? Number(report.priceMid) : null,
        priceLowRaw: report.priceLow ? Number(report.priceLow) : null,
        priceHighRaw: report.priceHigh ? Number(report.priceHigh) : null,
      },

      comparables: formattedComps,
      numComparables: formattedComps.length,

      marketSnapshots: snapshots.map((s) => ({
        period: s.period,
        avgPrice: s.avgPrice ? `$${Number(s.avgPrice).toLocaleString()}` : null,
        medianPrice: s.medianPrice
          ? `$${Number(s.medianPrice).toLocaleString()}`
          : null,
        avgDom: s.avgDom,
        activeCount: s.activeCount,
        soldCount: s.soldCount,
        avgPricePerSqft: s.avgPricePerSqft
          ? `$${Number(s.avgPricePerSqft).toLocaleString()}`
          : null,
      })),

      neighborhood: neighborhoodData,

      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
  } catch (error) {
    console.error("Canva data error:", error);
    return NextResponse.json(
      { error: "Failed to build CMA data for Canva" },
      { status: 500 }
    );
  }
}
