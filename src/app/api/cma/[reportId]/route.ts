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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);

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

    return NextResponse.json({
      ...report,
      subjectProperty: subject,
      comparables: compsWithAdjustments,
      marketSnapshots: snapshots,
    });
  } catch (error) {
    console.error("Get CMA report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CMA report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);
    const body = await request.json();

    await db
      .update(cmaReports)
      .set({
        title: body.title,
        status: body.status,
        priceLow: body.priceLow,
        priceMid: body.priceMid,
        priceHigh: body.priceHigh,
        notes: body.notes,
        canvaDesignId: body.canvaDesignId,
        canvaDesignUrl: body.canvaDesignUrl,
        pdfUrl: body.pdfUrl,
      })
      .where(eq(cmaReports.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update CMA report error:", error);
    return NextResponse.json(
      { error: "Failed to update CMA report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);

    // Fetch the report to get subject property ID
    const [report] = await db
      .select()
      .from(cmaReports)
      .where(eq(cmaReports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete in order of dependencies:
    // 1. Delete adjustments for all comps in this report
    const comps = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.cmaReportId, id));

    for (const comp of comps) {
      await db.delete(adjustments).where(eq(adjustments.comparableId, comp.id));
    }

    // 2. Delete comparable properties
    await db.delete(comparableProperties).where(eq(comparableProperties.cmaReportId, id));

    // 3. Delete market snapshots
    await db.delete(marketSnapshots).where(eq(marketSnapshots.cmaReportId, id));

    // 4. Delete the CMA report itself
    await db.delete(cmaReports).where(eq(cmaReports.id, id));

    // 5. Delete the subject property (only if it exists)
    if (report.subjectPropertyId) {
      await db.delete(subjectProperties).where(eq(subjectProperties.id, report.subjectPropertyId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete CMA report error:", error);
    return NextResponse.json(
      { error: "Failed to delete CMA report" },
      { status: 500 }
    );
  }
}
