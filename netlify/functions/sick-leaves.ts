import { db } from "../../db/index.js";
import { sickLeaves } from "../../db/schema.js";
import { eq, or, sql } from "drizzle-orm";
import crypto from "node:crypto";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  });
  return out;
}

async function isAuthenticated(request) {
  let token = "";
  const cookies = parseCookies(request);
  if (cookies["seha_session"]) token = cookies["seha_session"];
  const authHeader = request.headers.get("authorization") || "";
  if (!token && authHeader.toLowerCase().startsWith("bearer ")) token = authHeader.slice(7).trim();
  if (!token) return false;
  try {
    const rows = await db.execute(
      sql`SELECT 1 FROM sessions WHERE token_hash = ${crypto.createHash("sha256").update(token).digest("hex")} AND expires_at > NOW() LIMIT 1`
    );
    return rows.rows ? rows.rows.length > 0 : true;
  } catch (e) {
    return false;
  }
}

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

function rowToPayload(row) {
  return row.payload && typeof row.payload === "object" ? row.payload : {};
}

async function handle(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: HEADERS });
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // All record access (read and write) requires an authenticated admin session.
  // Public visitors must use /api/inquiry which demands both the national ID and the
  // service code, so patient records can never be enumerated.
  if (!(await isAuthenticated(request))) {
    return jsonResponse({ success: false, message: "غير مصرح لك بالوصول، يرجى تسجيل الدخول" }, 401);
  }

  // POST /api/sick-leaves/sync — full replace (admin only)
  if (path.endsWith("/sync") && method === "POST") {
    let body: any = {};
    try { body = await request.json(); } catch (e) {}
    const incoming = Array.isArray(body.leaves) ? body.leaves : [];
    if (incoming.length > 0) {
      await db.delete(sickLeaves);
      const values = incoming
        .filter((l) => l && normalizeCode(l.NormalizedServiceCode || l.LeaveId))
        .map((l) => ({
          recordId: String(l.id || normalizeCode(l.NormalizedServiceCode)),
          patientId: String(l.PatientId || "").trim(),
          serviceCode: normalizeCode(l.NormalizedServiceCode || l.LeaveId),
          patientName: String(l.PatientName || l["Patient Name"] || "").trim(),
          hospital: String(l.Hospital || l.OrganizationName || "").trim(),
          doctorName: String(l.DoctorName || l["Doctor NAME"] || "").trim(),
          status: String(l.Status || "نشطة / سارية").trim(),
          isCompanion: !!(l.isCompanion || l.type === "companion" || l.CompanionName || l["Patient Name"]),
          fromDate: String(l.From || "").trim(),
          toDate: String(l.To || "").trim(),
          payload: l,
        }));
      if (values.length > 0) await db.insert(sickLeaves).values(values).onConflictDoNothing();
    }
    return jsonResponse({ success: true, message: "تمت المزامنة بنجاح" }, 200);
  }

  if (path === "/api/sick-leaves" || path === "/api/sick-leaves/") {
    if (method === "GET") {
      const rows = await db.select().from(sickLeaves).orderBy(sql`${sickLeaves.createdAt} DESC`);
      return jsonResponse({ success: true, count: rows.length, data: rows.map(rowToPayload) }, 200);
    }
    if (method === "POST") {
      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const code = normalizeCode(body.NormalizedServiceCode || body.LeaveId);
      if (!code) {
        return jsonResponse({ success: false, message: "رمز الخدمة مطلوب" }, 400);
      }
      const values = {
        recordId: String(body.id || code),
        patientId: String(body.PatientId || "").trim(),
        serviceCode: code,
        patientName: String(body.PatientName || body["Patient Name"] || "").trim(),
        hospital: String(body.Hospital || body.OrganizationName || "").trim(),
        doctorName: String(body.DoctorName || body["Doctor NAME"] || "").trim(),
        status: String(body.Status || "نشطة / سارية").trim(),
        isCompanion: !!(body.isCompanion || body.type === "companion" || body.CompanionName || body["Patient Name"]),
        fromDate: String(body.From || "").trim(),
        toDate: String(body.To || "").trim(),
        payload: body,
      };
      const [row] = await db
        .insert(sickLeaves)
        .values(values)
        .onConflictDoUpdate({ target: sickLeaves.serviceCode, set: { ...values, updatedAt: new Date() } })
        .returning();
      return jsonResponse({ success: true, message: "تم حفظ التقرير في قاعدة البيانات بنجاح", data: rowToPayload(row) }, 200);
    }
  }

  const idMatch = path.match(/^\/api\/sick-leaves\/([^/]+)$/);
  if (idMatch) {
    const target = decodeURIComponent(idMatch[1]).trim().toLowerCase();
    if (method === "PUT") {
      let body: any = {};
      try { body = await request.json(); } catch (e) {}
      const values = {
        recordId: String(body.id || target),
        patientId: String(body.PatientId || "").trim(),
        serviceCode: normalizeCode(body.NormalizedServiceCode || body.LeaveId) || target,
        patientName: String(body.PatientName || body["Patient Name"] || "").trim(),
        hospital: String(body.Hospital || body.OrganizationName || "").trim(),
        doctorName: String(body.DoctorName || body["Doctor NAME"] || "").trim(),
        status: String(body.Status || "نشطة / سارية").trim(),
        isCompanion: !!(body.isCompanion || body.type === "companion" || body.CompanionName || body["Patient Name"]),
        fromDate: String(body.From || "").trim(),
        toDate: String(body.To || "").trim(),
        payload: body,
        updatedAt: new Date(),
      };
      const updated = await db
        .update(sickLeaves)
        .set(values)
        .where(or(eq(sickLeaves.serviceCode, target), eq(sickLeaves.recordId, target)))
        .returning();
      if (updated.length === 0) {
        return jsonResponse({ success: false, message: "السجل غير موجود" }, 404);
      }
      return jsonResponse({ success: true, message: "تم تحديث التقرير في قاعدة البيانات بنجاح", data: rowToPayload(updated[0]) }, 200);
    }
    if (method === "DELETE") {
      await db.delete(sickLeaves).where(or(eq(sickLeaves.serviceCode, target), eq(sickLeaves.recordId, target)));
      return jsonResponse({ success: true, message: "تم حذف التقرير من قاعدة البيانات بنجاح" }, 200);
    }
    if (method === "GET") {
      const rows = await db
        .select()
        .from(sickLeaves)
        .where(or(eq(sickLeaves.serviceCode, target), eq(sickLeaves.recordId, target)))
        .limit(1);
      return jsonResponse({ success: rows.length > 0, data: rows.map(rowToPayload) }, 200);
    }
  }

  return jsonResponse({ success: false, message: "Method not allowed" }, 405);
}

export default async (request: Request) => {
  try {
    return await handle(request);
  } catch (e) {
    return jsonResponse({ success: false, message: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً" }, 500);
  }
};
