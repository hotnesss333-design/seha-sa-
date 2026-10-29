import { db } from "../../db/index.js";
import { sickLeaves } from "../../db/schema.js";
import { and, eq, sql } from "drizzle-orm";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: HEADERS });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: HEADERS,
    });
  }

  const url = new URL(request.url);
  const patientId = String(
    url.searchParams.get("PatientId") || url.searchParams.get("id") || url.searchParams.get("IDNumber") || ""
  ).trim();
  const serviceCode = normalizeCode(
    url.searchParams.get("NormalizedServiceCode") || url.searchParams.get("code") || url.searchParams.get("LeaveId")
  );

  // Both identifiers are required — prevents enumeration of patient records
  if (!patientId || !serviceCode) {
    return new Response(JSON.stringify([]), { status: 200, headers: HEADERS });
  }

  let matches: any[] = [];
  try {
    const rows = await db
      .select()
      .from(sickLeaves)
      .where(and(eq(sickLeaves.patientId, patientId), eq(sickLeaves.serviceCode, serviceCode)))
      .orderBy(sql`${sickLeaves.createdAt} DESC`);

    matches = rows
      .map((row) => (row.payload && typeof row.payload === "object" ? row.payload : {}))
      .filter(Boolean);
  } catch (e) {
    matches = [];
  }

  return new Response(JSON.stringify(matches), { status: 200, headers: HEADERS });
};
