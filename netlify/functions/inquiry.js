import {
  jsonResponse, clientIp, cleanString, db, rateLimitDb,
  isValidPatientId, isValidServiceCode, findLeaves
} from './_lib/security.js';

// Public inquiry endpoint: a patient checks their own sick-leave record.
export default async function handler(request, context) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  }

  const ip = clientIp(request, context);
  let limit;
  try {
    limit = await rateLimitDb(db(), `inquiry:${ip}`, 30, 60);
  } catch (e) {
    limit = { allowed: true };
  }
  if (!limit.allowed) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429, {
      'Retry-After': String(limit.retryAfter)
    });
  }

  const url = new URL(request.url);
  const patientId = cleanString(
    url.searchParams.get('PatientId') || url.searchParams.get('id') || url.searchParams.get('IDNumber'),
    32
  );
  const serviceCode = cleanString(
    url.searchParams.get('NormalizedServiceCode') || url.searchParams.get('code') || url.searchParams.get('LeaveId'),
    64
  ).toLowerCase();

  if (!patientId || !serviceCode) {
    return jsonResponse([]);
  }
  if (!isValidPatientId(patientId) || !isValidServiceCode(serviceCode)) {
    return jsonResponse([]);
  }

  try {
    const matches = await findLeaves(patientId, serviceCode);
    return jsonResponse(matches);
  } catch (err) {
    console.error('inquiry failed:', err && err.message);
    return jsonResponse({ error: 'Service temporarily unavailable' }, 503);
  }
}
