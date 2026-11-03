import { createHash, createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const digest = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export function equal(a, b) { return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
export function sameOrigin(req) {
  if (req.headers.get('origin') !== new URL(req.url).origin || ['cross-site', 'none'].includes(req.headers.get('sec-fetch-site'))) throw new HttpError(403, 'الطلب غير مسموح');
}
export function csrf(req, cookie) {
  sameOrigin(req);
  const value = req.headers.get('x-csrf-token');
  if (!cookie || !/^[a-f0-9]{64}$/.test(cookie) || !equal(cookie, value)) throw new HttpError(403, 'انتهت صلاحية التحقق؛ أعد تحميل الصفحة');
  return value;
}
export async function jsonBody(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers.get('content-type') || '')) throw new HttpError(415, 'نوع المحتوى غير مدعوم');
  let size = 0; const chunks = [];
  for await (const chunk of req.body || []) { size += chunk.byteLength; if (size > 16384) throw new HttpError(413, 'الطلب أكبر من الحد المسموح'); chunks.push(Buffer.from(chunk)); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!body || Array.isArray(body) || typeof body !== 'object') throw Error(); return body; }
  catch { throw new HttpError(400, 'بيانات JSON غير صحيحة'); }
}
export function text(value, max = 200, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /[<>"'`\u0000-\u001f\u007f]/u.test(value)) throw new HttpError(400, 'قيمة حقل غير صالحة');
  return value.normalize('NFC').trim();
}
export function identifiers(patient, code) {
  if (typeof patient !== 'string' || !/^\d{10}$/.test(patient) || typeof code !== 'string' || !/^[a-zA-Z0-9-]{6,40}$/.test(code)) throw new HttpError(400, 'رقم الهوية أو رمز الخدمة غير صالح');
  return [patient, code.toLowerCase()];
}
/** @returns {Record<string, any>} */
export function validateRecord(body) {
  const strings = ['id','PatientId','NormalizedServiceCode','PatientName','SickLeaveDate','From','To','Hospital','OrganizationName','DoctorName','Doctor NAME','JobTitle','Status','Notes','type','CompanionName','Patient Name','RelationshipName','RelationshipText'];
  const allowed = new Set([...strings,'Duration','Relationship','isCompanion']);
  if (Object.keys(body).some(k => !allowed.has(k))) throw new HttpError(400, 'حقول غير معروفة');
  const result = {};
  for (const field of strings) if (body[field] !== undefined) result[field] = text(body[field], field === 'Notes' ? 2000 : 200, false);
  identifiers(result.PatientId, result.NormalizedServiceCode);
  result.PatientName = text(result.PatientName);
  for (const field of ['From','To','SickLeaveDate']) {
    const date = result[field];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new HttpError(400, 'تاريخ غير صالح');
  }
  const days = (Date.parse(result.To) - Date.parse(result.From)) / 86400000 + 1;
  if (days < 1 || days > 366 || !Number.isInteger(body.Duration) || days !== body.Duration) throw new HttpError(400, 'مدة الإجازة غير صالحة');
  result.Duration = days;
  if (body.Relationship !== undefined) { if (!Number.isInteger(body.Relationship) || body.Relationship < 1 || body.Relationship > 18) throw new HttpError(400, 'صلة القرابة غير صالحة'); result.Relationship = body.Relationship; }
  if (body.isCompanion !== undefined) { if (typeof body.isCompanion !== 'boolean') throw new HttpError(400, 'نوع التقرير غير صالح'); result.isCompanion = body.isCompanion; }
  if (result.type && !['companion','leave'].includes(result.type)) throw new HttpError(400, 'نوع التقرير غير صالح');
  return result;
}
function key() {
  const encoded = globalThis.Netlify?.env.get('HEALTH_DATA_KEY');
  if (!encoded || !/^[a-f0-9]{64}$/i.test(encoded)) throw new HttpError(503, 'التخزين الآمن غير مهيأ؛ تواصل مع مسؤول الموقع');
  return Buffer.from(encoded, 'hex');
}
export function lookup(patient, code) { return createHmac('sha256', key()).update(JSON.stringify(identifiers(patient, code))).digest('hex'); }
export function seal(record, id) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv); cipher.setAAD(Buffer.from(id));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(record), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.');
}
export function open(encrypted, id) {
  const [version, iv, tag, content] = encrypted.split('.'); if (version !== 'v1') throw Error('Invalid ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64')); decipher.setAAD(Buffer.from(id)); decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(content, 'base64')), decipher.final()]).toString('utf8'));
}
export function response(data, status = 200, extra = {}) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...extra } }); }
