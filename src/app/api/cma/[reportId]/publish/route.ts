import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { cmaReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/cma/[reportId]/publish
 *
 * Publishes the CMA report as a shareable website.
 * Generates a unique public token for the URL.
 */
export async function POST(
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

    // Reuse existing token if already published before
    const token =
      report.publicToken || crypto.randomBytes(32).toString("hex");

    await db
      .update(cmaReports)
      .set({
        isPublished: true,
        publicToken: token,
        publishedAt: new Date(),
      })
      .where(eq(cmaReports.id, id));

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    const siteUrl = `${baseUrl}/site/${token}`;

    return NextResponse.json({
      success: true,
      token,
      siteUrl,
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish report" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cma/[reportId]/publish
 *
 * Unpublishes the report (keeps token for re-publish).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;
    const id = parseInt(reportId, 10);

    await db
      .update(cmaReports)
      .set({ isPublished: false })
      .where(eq(cmaReports.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish report" },
      { status: 500 }
    );
  }
}
