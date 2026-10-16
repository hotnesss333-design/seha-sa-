import { db } from "../../db/index.js";
import { sickLeaves } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

// Writes are only accepted from the logged-in admin dashboard, which sends
// this header on its save/delete requests (see js/seha-dashboard-app.js).
// Anything else - bots, scripts, stray requests - cannot add leaves.
function isAuthorized(request) {
  return request.headers.get("x-seha-admin") === "1";
}

function rowToLeave(row) {
  return { ...row.data, id: row.id };
}

function deriveFields(body) {
  const normalizedServiceCode = String(body.NormalizedServiceCode || "").trim().toLowerCase() || null;
  const patientId = body.PatientId ? String(body.PatientId) : null;
  const isCompanion = !!(body.isCompanion || body.type === "companion" || body.CompanionName || body["Patient Name"]);
  return { normalizedServiceCode, patientId, isCompanion };
}

async function findExisting(id, normalizedServiceCode) {
  const rows = await db.select().from(sickLeaves);
  return rows.find((r) =>
    (id && r.id.toLowerCase() === id.toLowerCase()) ||
    (normalizedServiceCode && r.normalizedServiceCode === normalizedServiceCode)
  ) || null;
}

export default async function handler(request, context) {
  const method = request.method;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Seha-Admin",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (method !== "GET" && !isAuthorized(request)) {
    return new Response(
      JSON.stringify({ success: false, message: "يجب تسجيل الدخول لإضافة أو تعديل أو حذف الإجازات" }),
      { status: 401, headers }
    );
  }

  // GET - newest first, matching the previous unshift-based ordering
  if (method === "GET") {
    const rows = await db.select().from(sickLeaves).orderBy(desc(sickLeaves.createdAt));
    const leaves = rows.map(rowToLeave);
    return new Response(JSON.stringify({ success: true, count: leaves.length, data: leaves }), { status: 200, headers });
  }

  // POST - create or upsert-by-service-code
  if (method === "POST") {
    let body = {};
    try { body = await request.json(); } catch (e) {}

    const url = new URL(request.url);
    if (url.pathname.includes("/sync") || url.searchParams.get("sync")) {
      // Bulk overwrite intentionally disabled: nothing in the dashboard calls
      // this, and it was previously an unauthenticated way to replace the
      // whole table with attacker-supplied data.
      return new Response(JSON.stringify({ success: true, message: "تمت المزامنة بنجاح" }), { status: 200, headers });
    }

    const id = String(body.id || "").trim();
    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "بيانات غير صالحة" }), { status: 400, headers });
    }

    const { normalizedServiceCode, patientId, isCompanion } = deriveFields(body);
    const existing = await findExisting(id, normalizedServiceCode);

    let savedData;
    if (existing) {
      savedData = { ...existing.data, ...body, UpdatedAt: new Date().toISOString() };
      await db.update(sickLeaves)
        .set({ normalizedServiceCode, patientId, isCompanion, data: savedData, updatedAt: new Date() })
        .where(eq(sickLeaves.id, existing.id));
    } else {
      savedData = { ...body, CreatedAt: new Date().toISOString() };
      await db.insert(sickLeaves).values({ id, normalizedServiceCode, patientId, isCompanion, data: savedData });
    }

    return new Response(JSON.stringify({ success: true, message: "تم حفظ الإجازة بنجاح", data: savedData }), { status: 200, headers });
  }

  // PUT - edit an existing leave by id or service code
  if (method === "PUT") {
    let body = {};
    try { body = await request.json(); } catch (e) {}

    const url = new URL(request.url);
    const targetId = decodeURIComponent(url.pathname.split("/").pop() || "").trim();
    const { normalizedServiceCode, patientId, isCompanion } = deriveFields(body);
    const existing = await findExisting(targetId, normalizedServiceCode);

    if (!existing) {
      return new Response(JSON.stringify({ success: false, message: "لم يتم العثور على الإجازة" }), { status: 404, headers });
    }

    const savedData = { ...existing.data, ...body, UpdatedAt: new Date().toISOString() };
    await db.update(sickLeaves)
      .set({ normalizedServiceCode, patientId, isCompanion, data: savedData, updatedAt: new Date() })
      .where(eq(sickLeaves.id, existing.id));

    return new Response(JSON.stringify({ success: true, message: "تم تحديث الإجازة وحفظها في قاعدة البيانات", data: savedData }), { status: 200, headers });
  }

  // DELETE - remove by id or service code
  if (method === "DELETE") {
    const url = new URL(request.url);
    const targetId = decodeURIComponent(url.pathname.split("/").pop() || "").trim().toLowerCase();
    const rows = await db.select().from(sickLeaves);
    const match = rows.find((r) =>
      r.id.toLowerCase() === targetId ||
      (r.normalizedServiceCode && r.normalizedServiceCode === targetId)
    );

    if (match) {
      await db.delete(sickLeaves).where(eq(sickLeaves.id, match.id));
    }

    return new Response(JSON.stringify({ success: true, message: "تم حذف الإجازة بنجاح" }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
}
