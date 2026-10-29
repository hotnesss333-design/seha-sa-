import crypto from 'node:crypto';
import { getDatabase } from '@netlify/database';

const PBKDF2_ITERATIONS = 210000;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_COOKIE = 'seha_session';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
const SECURITY_RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY'
};

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...SECURITY_RESPONSE_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
export function db() {
  return getDatabase();
}

// @netlify/database's sql`` returns rows as a plain array; normalise both shapes.
function rowsOf(result) {
  if (Array.isArray(result)) return result;
  return (result && result.rows) || [];
}

export async function ensureSecret(key) {
  const database = db();
  const existing = await database.sql`SELECT value FROM app_secrets WHERE key = ${key} LIMIT 1`;
  if (existing.length > 0) {
    return existing[0].value;
  }
  const value = crypto.randomBytes(48).toString('hex');
  await database.sql`
    INSERT INTO app_secrets (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO NOTHING
  `;
  const rows = await database.sql`SELECT value FROM app_secrets WHERE key = ${key} LIMIT 1`;
  return rows[0].value;
}

// ---------------------------------------------------------------------------
// Password hashing (PBKDF2-SHA512, per-user random salt)
// ---------------------------------------------------------------------------
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, salt, expectedHash) {
  const computed = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(String(expectedHash), 'hex');
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// ---------------------------------------------------------------------------
// Sessions: HMAC-signed opaque tokens delivered in an HttpOnly cookie
// ---------------------------------------------------------------------------
function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

export async function createSessionToken(username) {
  const secret = await ensureSecret('session_secret');
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = b64url(JSON.stringify({ u: String(username), e: exp, n: nonce }));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const secret = await ensureSecret('session_secret');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let given;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch (e) {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
  if (!data || typeof data.u !== 'string' || typeof data.e !== 'number') return null;
  if (data.e < Math.floor(Date.now() / 1000)) return null;
  return { username: data.u, expiresAt: data.e };
}

export function parseCookies(header) {
  const out = {};
  if (typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    out[name] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function sessionCookieHeader(token, maxAgeSeconds = SESSION_TTL_SECONDS) {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`
  ];
  return attrs.join('; ');
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

// Returns { username } when the request carries a valid admin session.
export async function getAdminSession(request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  let token = cookies[SESSION_COOKIE];
  if (!token) {
    const auth = request.headers.get('authorization') || '';
    if (auth.toLowerCase().startsWith('bearer ')) {
      token = auth.slice(7).trim();
    }
  }
  if (!token) return null;
  return verifySessionToken(token);
}

// ---------------------------------------------------------------------------
// CSRF defence-in-depth: mutations must originate from this site
// ---------------------------------------------------------------------------
export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl) rely on cookie auth anyway
  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get('host') || new URL(request.url).host;
    return !!host && originHost === host;
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory fast path + persistent DB-backed enforcement)
// ---------------------------------------------------------------------------
const buckets = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 20000) buckets.clear();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) };
  }
  return { allowed: true, remaining: limit - entry.count };
}

// Persistent limiter that survives across function instances (shared table).
export async function rateLimitDb(database, key, limit, windowSeconds) {
  const result = await database.sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, NOW(), 1)
    ON CONFLICT (key) DO UPDATE
      SET count = CASE
            WHEN rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN 1
            ELSE rate_limits.count + 1
          END,
          window_start = CASE
            WHEN rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN NOW()
            ELSE rate_limits.window_start
          END
    RETURNING count, window_start
  `;
  const row = rowsOf(result)[0] || {};
  const count = Number(row.count || 1);
  if (count > limit) {
    const started = row.window_start ? new Date(row.window_start).getTime() : Date.now();
    const retryAfter = Math.max(1, Math.ceil((started + windowSeconds * 1000 - Date.now()) / 1000));
    return { allowed: false, retryAfter };
  }
  // Opportunistic cleanup of stale windows
  if (Math.random() < 0.02) {
    try {
      await database.sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day'`;
    } catch (e) {}
  }
  return { allowed: true, remaining: limit - count };
}

export function clientIp(request, context) {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  if (context && context.ip) return context.ip;
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
export function cleanString(value, maxLength = 300) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

export function isValidPatientId(value) {
  return /^[0-9]{5,15}$/.test(String(value || '').trim());
}

export function isValidServiceCode(value) {
  return /^[a-z0-9][a-z0-9_-]{1,39}$/i.test(String(value || '').trim());
}

export function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

const ALLOWED_LEAVE_FIELDS = [
  'id', 'PatientId', 'NormalizedServiceCode', 'PatientName', 'SickLeaveDate',
  'From', 'To', 'Duration', 'Hospital', 'OrganizationName', 'DoctorName',
  'Doctor NAME', 'JobTitle', 'Status', 'Notes', 'isCompanion', 'type',
  'CompanionName', 'Patient Name', 'Relationship', 'RelationshipName',
  'RelationshipText', 'CreatedAt', 'UpdatedAt'
];

const STRING_FIELDS = [
  'PatientId', 'NormalizedServiceCode', 'PatientName', 'SickLeaveDate', 'From',
  'To', 'Hospital', 'OrganizationName', 'DoctorName', 'Doctor NAME', 'JobTitle',
  'Status', 'Notes', 'CompanionName', 'Patient Name', 'RelationshipName',
  'RelationshipText', 'id', 'type'
];

// Validates and normalises a submitted sick-leave / companion record.
// Returns { ok: true, record } or { ok: false, error }.
export function sanitizeLeavePayload(body, { requirePatientAndCode = true } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid payload' };
  }
  const record = {};

  for (const field of ALLOWED_LEAVE_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    if (STRING_FIELDS.includes(field)) {
      record[field] = cleanString(value, field === 'Notes' ? 1000 : 200);
    } else if (field === 'Duration') {
      const n = parseInt(value, 10);
      record[field] = Number.isFinite(n) ? Math.min(Math.max(n, 1), 365) : 1;
    } else if (field === 'Relationship') {
      const n = parseInt(value, 10);
      record[field] = Number.isFinite(n) ? Math.min(Math.max(n, 1), 99) : 1;
    } else if (field === 'isCompanion') {
      record[field] = !!value;
    }
  }

  if (requirePatientAndCode) {
    if (!record.PatientId || !isValidPatientId(record.PatientId)) {
      return { ok: false, error: 'Invalid PatientId' };
    }
    if (!record.NormalizedServiceCode || !isValidServiceCode(record.NormalizedServiceCode)) {
      return { ok: false, error: 'Invalid NormalizedServiceCode' };
    }
  }

  if (record.SickLeaveDate && !isValidIsoDate(record.SickLeaveDate)) {
    return { ok: false, error: 'Invalid SickLeaveDate' };
  }
  if (record.From && !isValidIsoDate(record.From)) {
    return { ok: false, error: 'Invalid From date' };
  }
  if (record.To && !isValidIsoDate(record.To)) {
    return { ok: false, error: 'Invalid To date' };
  }

  return { ok: true, record };
}

// ---------------------------------------------------------------------------
// Leaves data access (shared by inquiry + admin endpoints)
// ---------------------------------------------------------------------------
export async function findLeaves(patientId, serviceCode) {
  const database = db();
  const code = String(serviceCode || '').trim().toLowerCase();
  const rows = await database.sql`
    SELECT data FROM sick_leaves
    WHERE patient_id = ${String(patientId || '').trim()}
      AND service_code = ${code}
    ORDER BY created_at DESC
  `;
  return rows.map(r => r.data);
}

export async function getAllLeaves() {
  const database = db();
  const rows = await database.sql`SELECT data FROM sick_leaves ORDER BY created_at DESC`;
  return rows.map(r => r.data);
}

export async function upsertLeave(record) {
  const database = db();
  const recordId = cleanString(record.id || `${Date.now()}`, 64);
  const patientId = cleanString(record.PatientId || recordId, 64);
  const code = cleanString(record.NormalizedServiceCode || recordId, 64).toLowerCase();
  const isComp = !!(record.isCompanion || record.type === 'companion' || record.CompanionName || record['Patient Name']);
  const withId = { ...record, id: recordId };
  await database.sql`
    INSERT INTO sick_leaves (record_id, patient_id, service_code, is_companion, data)
    VALUES (${recordId}, ${patientId}, ${code}, ${isComp}, ${JSON.stringify(withId)}::jsonb)
    ON CONFLICT (record_id) DO UPDATE
      SET data = EXCLUDED.data,
          patient_id = EXCLUDED.patient_id,
          service_code = EXCLUDED.service_code,
          is_companion = EXCLUDED.is_companion,
          updated_at = NOW()
  `;
  return withId;
}

export async function updateLeaveById(targetId, record) {
  const database = db();
  const key = String(targetId || '').trim().toLowerCase();
  const result = await database.sql`
    UPDATE sick_leaves
    SET data = data || ${JSON.stringify({ ...record, UpdatedAt: new Date().toISOString() })}::jsonb,
        patient_id = COALESCE(NULLIF(${cleanString(record.PatientId || '', 64)}, ''), patient_id),
        service_code = COALESCE(NULLIF(lower(${cleanString(record.NormalizedServiceCode || '', 64)}), ''), service_code),
        updated_at = NOW()
    WHERE lower(record_id) = ${key}
       OR lower(data->>'NormalizedServiceCode') = ${key}
    RETURNING data
  `;
  return rowsOf(result)[0]?.data || null;
}

export async function deleteLeaveById(targetId) {
  const database = db();
  const key = String(targetId || '').trim().toLowerCase();
  const result = await database.sql`
    DELETE FROM sick_leaves
    WHERE lower(record_id) = ${key}
       OR lower(data->>'NormalizedServiceCode') = ${key}
    RETURNING record_id
  `;
  return rowsOf(result).length;
}

export async function getAllUsers() {
  const database = db();
  const rows = await database.sql`
    SELECT username, name, role, created_at, updated_at FROM users ORDER BY created_at ASC
  `;
  return rows.map(r => ({
    username: r.username,
    name: r.name,
    role: r.role,
    created_at: r.created_at,
    updated_at: r.updated_at
  }));
}

export async function findUser(username) {
  const database = db();
  const rows = await database.sql`SELECT * FROM users WHERE username = ${String(username || '').trim()} LIMIT 1`;
  return rows[0] || null;
}

export async function countUsers() {
  const database = db();
  const rows = await database.sql`SELECT COUNT(*)::int AS count FROM users`;
  return (rows[0] && rows[0].count) || 0;
}

export async function createUser({ username, name, role, password }) {
  const database = db();
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  await database.sql`
    INSERT INTO users (username, name, role, password_hash, password_salt)
    VALUES (${username}, ${name}, ${role || 'admin'}, ${hash}, ${salt})
    ON CONFLICT (username) DO NOTHING
  `;
}

export async function updateUser(username, { newUsername, name, password }) {
  const database = db();
  if (password) {
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    if (newUsername && newUsername !== username) {
      await database.sql`
        UPDATE users SET username = ${newUsername}, password_hash = ${hash}, password_salt = ${salt}, updated_at = NOW()
        WHERE username = ${username}
      `;
    } else {
      await database.sql`
        UPDATE users SET password_hash = ${hash}, password_salt = ${salt}, updated_at = NOW()
        WHERE username = ${username}
      `;
    }
    return;
  }
  if (newUsername && newUsername !== username) {
    await database.sql`UPDATE users SET username = ${newUsername}, updated_at = NOW() WHERE username = ${username}`;
    return;
  }
  if (name) {
    await database.sql`UPDATE users SET name = ${name}, updated_at = NOW() WHERE username = ${username}`;
  }
}

export async function deleteUser(username) {
  const database = db();
  const result = await database.sql`DELETE FROM users WHERE username = ${String(username || '').trim()} RETURNING username`;
  return rowsOf(result).length;
}
