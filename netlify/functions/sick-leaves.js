import {
  jsonResponse, rateLimit, clientIp, isSameOrigin, getAdminSession,
  getAllLeaves, upsertLeave, updateLeaveById, deleteLeaveById,
  sanitizeLeavePayload, cleanString
} from './_lib/security.js';

const MAX_BODY_BYTES = 128 * 1024;

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { tooLarge: true };
  }
  try {
    return { body: JSON.parse(text || '{}') };
  } catch (e) {
    return { body: null };
  }
}

export default async function handler(request, context) {
  const method = request.method;
  const url = new URL(request.url);
  const ip = clientIp(request, context);

  if (method === 'OPTIONS') {
    return new Response('', { status: 204 });
  }

  const limit = rateLimit(`leaves:${ip}`, 60, 60 * 1000);
  if (!limit.allowed) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429, {
      'Retry-After': String(limit.retryAfter)
    });
  }

  // Every sick-leave operation requires an authenticated admin session.
  const session = await getAdminSession(request);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (method !== 'GET' && !isSameOrigin(request)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  try {
    // GET /api/sick-leaves — full admin listing
    if (method === 'GET') {
      const leaves = await getAllLeaves();
      return jsonResponse({ success: true, count: leaves.length, data: leaves });
    }

    // POST /api/sick-leaves/sync — bulk replace (admin)
    if (method === 'POST' && (url.pathname.includes('/sync') || url.searchParams.get('sync'))) {
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ error: 'Payload too large' }, 413);
      if (!body || !Array.isArray(body.leaves) || body.leaves.length === 0 || body.leaves.length > 500) {
        return jsonResponse({ success: true, message: 'تمت المزامنة بنجاح' });
      }
      let saved = 0;
      for (const raw of body.leaves.slice(0, 500)) {
        const check = sanitizeLeavePayload(raw, { requirePatientAndCode: false });
        if (!check.ok || (!check.record.PatientId && !check.record.NormalizedServiceCode && !check.record.id)) continue;
        await upsertLeave(check.record);
        saved++;
      }
      return jsonResponse({ success: true, message: 'تمت المزامنة بنجاح', count: saved });
    }

    // POST /api/sick-leaves — create or upsert (admin)
    if (method === 'POST') {
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ error: 'Payload too large' }, 413);
      const check = sanitizeLeavePayload(body);
      if (!check.ok) {
        return jsonResponse({ success: false, error: check.error }, 400);
      }
      const saved = await upsertLeave(check.record);
      return jsonResponse({ success: true, message: 'تم حفظ الإجازة بنجاح', data: saved });
    }

    // PUT /api/sick-leaves/:id — partial update (admin)
    if (method === 'PUT') {
      const targetId = cleanString(decodeURIComponent(url.pathname.split('/').pop() || ''), 64);
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ error: 'Payload too large' }, 413);
      const check = sanitizeLeavePayload(body, { requirePatientAndCode: false });
      if (!check.ok) {
        return jsonResponse({ success: false, error: check.error }, 400);
      }
      const updated = await updateLeaveById(targetId, check.record);
      if (!updated) {
        return jsonResponse({ success: false, error: 'Not found' }, 404);
      }
      return jsonResponse({ success: true, message: 'تم تحديث الإجازة بنجاح', data: updated });
    }

    // DELETE /api/sick-leaves/:id (admin)
    if (method === 'DELETE') {
      const targetId = cleanString(decodeURIComponent(url.pathname.split('/').pop() || ''), 64);
      const deleted = await deleteLeaveById(targetId);
      return jsonResponse({ success: true, message: 'تم حذف الإجازة بنجاح', count: deleted });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('sick-leaves failed:', err && err.message);
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }
}
