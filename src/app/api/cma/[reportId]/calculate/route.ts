import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cmaReports,
  subjectProperties,
  comparableProperties,
  adjustments as adjustmentsTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runCmaAnalysis } from "@/lib/services/cma/engine";
import type { PropertyData } from "@/lib/services/cma/types";

function dbPropertyToPropertyData(row: Record<string, unknown>): PropertyData {
  return {
    mlsNumber: row.mlsNumber as string | undefined,
    streetAddress: row.streetAddress as string,
    city: row.city as string,
    state: row.state as string,
    zip: row.zip as string,
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    propertyType: row.propertyType as string | undefined,
    style: row.style as string | undefined,
    bedrooms: row.bedrooms as number | undefined,
    bedroomsPlus: row.bedroomsPlus as number | undefined,
    bathrooms: row.bathrooms as number | undefined,
    bathroomsHalf: row.bathroomsHalf as number | undefined,
    sqft: row.sqft as number | undefined,
    lotSqft: row.lotSqft as number | undefined,
    yearBuilt: row.yearBuilt as number | undefined,
    garage: row.garage as string | undefined,
    garageSpaces: row.garageSpaces as number | undefined,
    basement: row.basement as string | undefined,
    heating: row.heating as string | undefined,
    cooling: row.cooling as string | undefined,
    pool: row.pool as string | undefined,
    soldPrice: row.soldPrice ? Number(row.soldPrice) : undefined,
    listPrice: row.listPrice ? Number(row.listPrice) : undefined,
    soldDate: row.soldDate as string | undefined,
    daysOnMarket: row.daysOnMarket as number | undefined,
    images: row.images as string[] | undefined,
  };
}

export async function POST(
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
    if (!report.subjectPropertyId) {
      return NextResponse.json(
        { error: "No subject property set" },
        { status: 400 }
      );
    }

    const [subjectRow] = await db
      .select()
      .from(subjectProperties)
      .where(eq(subjectProperties.id, report.subjectPropertyId));

    if (!subjectRow) {
      return NextResponse.json(
        { error: "Subject property not found" },
        { status: 404 }
      );
    }

    // Fetch comparables
    const compRows = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.cmaReportId, id));

    if (compRows.length === 0) {
      return NextResponse.json(
        { error: "No comparable properties added" },
        { status: 400 }
      );
    }

    // Convert to PropertyData
    const subject = dbPropertyToPropertyData(subjectRow as unknown as Record<string, unknown>);
    const comps = compRows.map((row) =>
      dbPropertyToPropertyData(row as unknown as Record<string, unknown>)
    );

    // Run CMA analysis
    const result = runCmaAnalysis(subject, comps);

    // Persist adjustments and updated prices
    for (let i = 0; i < result.comparables.length; i++) {
      const analyzed = result.comparables[i];
      const compRow = compRows[i];

      // Update comparable with calculated values
      await db
        .update(comparableProperties)
        .set({
          adjustedPrice: String(analyzed.adjustedPrice),
          totalAdjustment: String(analyzed.totalAdjustment),
          weight: String(analyzed.weight),
          distanceKm: String(analyzed.distanceKm),
        })
        .where(eq(comparableProperties.id, compRow.id));

      // Delete old auto adjustments, keep manual
      // Insert new adjustments
      for (const adj of analyzed.adjustments) {
        await db.insert(adjustmentsTable).values({
          comparableId: compRow.id,
          category: adj.category,
          label: adj.label,
          subjectValue: adj.subjectValue,
          compValue: adj.compValue,
          autoAmount: String(adj.autoAmount),
          adjustmentAmount: String(adj.adjustmentAmount),
          isManual: adj.isManual,
          notes: adj.notes,
        });
      }
    }

    // Update report with price recommendation
    await db
      .update(cmaReports)
      .set({
        priceLow: String(result.priceRecommendation.low),
        priceMid: String(result.priceRecommendation.mid),
        priceHigh: String(result.priceRecommendation.high),
        status: "in_progress",
      })
      .where(eq(cmaReports.id, id));

    return NextResponse.json(result);
  } catch (error) {
    console.error("CMA calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate CMA" },
      { status: 500 }
    );
  }
}
