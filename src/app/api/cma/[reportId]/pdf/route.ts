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
import React from "react";
import { fetchNeighborhoodData } from "@/lib/services/neighborhood";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);

    // Fetch all report data
    const [report] = await db
      .select()
      .from(cmaReports)
      .where(eq(cmaReports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let subject = null;
    if (report.subjectPropertyId) {
      const [subj] = await db
        .select()
        .from(subjectProperties)
        .where(eq(subjectProperties.id, report.subjectPropertyId));
      subject = subj;
    }

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

    const snapshots = await db
      .select()
      .from(marketSnapshots)
      .where(eq(marketSnapshots.cmaReportId, id));

    // Fetch neighborhood data for subject property
    let neighborhoodData = null;
    if (subject?.latitude && subject?.longitude) {
      try {
        neighborhoodData = await fetchNeighborhoodData(
          String(subject.latitude),
          String(subject.longitude),
          subject.zip || undefined
        );
      } catch (err) {
        console.warn("Failed to fetch neighborhood data for PDF:", err);
      }
    }

    // Dynamically import React-PDF renderer
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { CmaReportPdf } = await import(
      "@/lib/services/pdf/templates/CmaReport"
    );

    // Create the React element for the PDF document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfProps: any = {
      report,
      subject: subject || null,
      comparables: compsWithAdjustments,
      marketSnapshots: snapshots,
      neighborhoodData: neighborhoodData || null,
    };

    const pdfElement = React.createElement(CmaReportPdf, pdfProps);

    // Render the PDF to a buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any);

    // Convert Node.js Buffer to Uint8Array for NextResponse compatibility
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CMA-Report-${id}.pdf"`,
        "Content-Length": String(uint8.byteLength),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: "Failed to generate PDF", details: err.message },
      { status: 500 }
    );
  }
}
