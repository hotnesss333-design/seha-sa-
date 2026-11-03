import type { Context } from '@netlify/functions';
import type { User } from '@netlify/identity';
import { login, admin, acceptInvite, recoverPassword } from '@netlify/identity';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { records, sessions, limits, contacts } from '../../db/schema.js';
import { HttpError, digest, token, equal, csrf, jsonBody, text, identifiers, validateRecord, lookup, seal, open, response } from '../../lib/security.mjs';

function cookie(context: Context, name: string, value: string, maxAge = 1800) {
  context.cookies.set({ name, value, path: '/', httpOnly: true, secure: true, sameSite: 'Strict', maxAge });
}
async function throttle(db: ReturnType<typeof database>, context: Context, scope: string, max: number, seconds = 600) {
  if (!context.ip) throw new HttpError(503, 'تعذر التحقق من الطلب');
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const id = digest(`${scope}:${context.ip}:${bucket}`);
  const [row] = await db.insert(limits).values({ id, count: 1, expiresAt: new Date((bucket + 1) * seconds * 1000) })
    .onConflictDoUpdate({ target: limits.id, set: { count: sql`${limits.count} + 1` } }).returning({ count: limits.count });
  if (row.count > max) throw new HttpError(429, 'محاولات كثيرة؛ حاول لاحقاً');
}
async function identity(db: ReturnType<typeof database>, context: Context) {
  const raw = context.cookies.get('__Host-seha_session');
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) throw new HttpError(401, 'يرجى تسجيل الدخول');
  const [session] = await db.select().from(sessions).where(and(eq(sessions.id, digest(raw)), gt(sessions.expiresAt, new Date()))).limit(1);
  if (!session) throw new HttpError(401, 'انتهت الجلسة؛ يرجى تسجيل الدخول');
  let user;
  try { user = await admin.getUser(session.userId); } catch { throw new HttpError(401, 'الجلسة غير صالحة'); }
  const role = user.roles?.includes('admin') ? 'admin' : user.roles?.includes('doctor') ? 'doctor' : 'member';
  return { user, role, session };
}
function publicUser(user: User) { return { id: user.id, username: user.email, name: user.name || user.email, role: user.roles?.includes('admin') ? 'admin' : user.roles?.includes('doctor') ? 'doctor' : 'member' }; }
type Transaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];
async function scoped<T>(db: ReturnType<typeof database>, auth: Awaited<ReturnType<typeof identity>>, callback: (tx: Transaction) => Promise<T>) {
  return db.transaction(async tx => {
    await tx.execute(sql`select set_config('app.user_id', ${auth.user.id}, true), set_config('app.role', ${auth.role}, true)`);
    return callback(tx);
  });
}
export default async function handler(req: Request, context: Context) {
  try {
    const path = new URL(req.url).pathname;
    if (!['GET','POST','PUT','DELETE'].includes(req.method)) return response({ message: 'Method not allowed' }, 405, { Allow: 'GET, POST, PUT, DELETE' });
    // Sensitive identifiers must never appear in GET URLs or proxy logs.
    if (/inquiry|inquiries/i.test(path) && req.method !== 'POST') throw new HttpError(405, 'استخدم نموذج الاستعلام الآمن');
    if (req.method !== 'GET') csrf(req, context.cookies.get('__Host-seha_csrf'));
    const db = database();
    await throttle(db, context, 'all', 180);
    if (path === '/api/security/session' && req.method === 'GET') {
      let auth = null;
      try { auth = await identity(db, context); } catch (error) { if (!(error instanceof HttpError) || error.status !== 401) throw error; }
      let csrfToken = context.cookies.get('__Host-seha_csrf');
      if (!csrfToken || !/^[a-f0-9]{64}$/.test(csrfToken) || (auth && !equal(digest(csrfToken), auth.session.csrfHash))) {
        csrfToken = token(); cookie(context, '__Host-seha_csrf', csrfToken);
        if (auth) await db.update(sessions).set({ csrfHash: digest(csrfToken) }).where(eq(sessions.id, auth.session.id));
      }
      return response({ csrfToken, user: auth ? publicUser(auth.user) : null });
    }
    if (['/api/users/login','/api/account/loginv3','/account/loginv3','/Account/loginv3','/api/security/accept-invite','/api/security/recover'].includes(path)) {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
      await throttle(db, context, 'login', 5, 900);
      const body = await jsonBody(req);
      const password = body.Password ?? body.password;
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new HttpError(400, 'بيانات الدخول غير صالحة');
      const email = body.Username ?? body.email;
      if (!path.endsWith('accept-invite') && !path.endsWith('recover') && (typeof email !== 'string' || email.length > 254 || !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email))) throw new HttpError(400, 'استخدم البريد الإلكتروني للحساب');
      let user;
      try {
        if (path.endsWith('accept-invite') || path.endsWith('recover')) {
          if (password.length < 12 || typeof body.token !== 'string' || body.token.length > 2048) throw Error();
          user = path.endsWith('accept-invite') ? await acceptInvite(body.token, password) : await recoverPassword(body.token, password);
        } else user = await login(email, password);
      } catch { throw new HttpError(401, 'بيانات الدخول غير صحيحة أو الرابط غير صالح'); }
      finally {
        // The SDK's browser-readable cookies are not used by this application.
        context.cookies.delete('nf_jwt'); context.cookies.delete('nf_refresh');
      }
      const old = context.cookies.get('__Host-seha_session');
      if (old) await db.delete(sessions).where(eq(sessions.id, digest(old)));
      const sessionToken = token(), csrfToken = token();
      await db.insert(sessions).values({ id: digest(sessionToken), userId: user.id, csrfHash: digest(csrfToken), expiresAt: new Date(Date.now() + 1800000) });
      cookie(context, '__Host-seha_session', sessionToken); cookie(context, '__Host-seha_csrf', csrfToken);
      return response({ errorCode: 0, csrfToken, user: publicUser(user), data: { userName: user.email, name: user.name } });
    }
    if (/inquiry|inquiries/i.test(path)) {
      await throttle(db, context, 'inquiry', 10, 900);
      const body = await jsonBody(req); const [patient, code] = identifiers(body.PatientId, body.NormalizedServiceCode);
      const hash = lookup(patient, code);
      // No identity-bearing fields or internal notes are returned to public callers.
      const rows = await db.transaction(async tx => {
        await tx.execute(sql`select set_config('app.lookup_hash', ${hash}, true)`);
        return tx.select().from(records).where(eq(records.lookupHash, hash)).limit(1);
      });
      return response(rows.map(row => {
        const data = open(row.encrypted, row.id);
        return Object.fromEntries(['PatientName','SickLeaveDate','From','To','Duration','Hospital','OrganizationName','DoctorName','JobTitle','Status','CompanionName','RelationshipName'].filter(key => data[key] !== undefined).map(key => [key, data[key]]));
      }));
    }
    if (path === '/api/contact' && req.method === 'POST') {
      await throttle(db, context, 'contact', 3, 3600);
      const body = await jsonBody(req);
      if (Object.keys(body).some(key => !['Name','Email','Subject','Message','website'].includes(key))) throw new HttpError(400, 'حقول غير معروفة');
      if (body.website) throw new HttpError(400, 'الطلب غير مسموح');
      const data = { Name: text(body.Name, 120), Email: text(body.Email, 254), Subject: text(body.Subject, 200), Message: text(body.Message, 4000) };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) throw new HttpError(400, 'البريد الإلكتروني غير صالح');
      const id = crypto.randomUUID();
      await db.insert(contacts).values({ id, encrypted: seal(data, id) });
      return response({ Data: true, success: true }, 201);
    }
    const auth = await identity(db, context);
    if (path === '/api/contact' && req.method === 'GET') {
      if (auth.role !== 'admin') throw new HttpError(403, 'صلاحيات غير كافية');
      return response({ data: (await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(100)).map(row => ({ ...open(row.encrypted, row.id), id: row.id })) });
    }
    if (req.method !== 'GET' && !equal(digest(req.headers.get('x-csrf-token') || ''), auth.session.csrfHash)) throw new HttpError(403, 'رمز التحقق غير صالح للجلسة');
    if (path === '/api/security/logout' && req.method === 'POST') {
      await db.delete(sessions).where(eq(sessions.id, auth.session.id));
      cookie(context, '__Host-seha_session', '', 0); cookie(context, '__Host-seha_csrf', '', 0);
      return response({ success: true });
    }
    if (path.startsWith('/api/users')) {
      if (auth.role !== 'admin') throw new HttpError(403, 'صلاحيات غير كافية');
      if (req.method === 'GET' && path === '/api/users') return response({ success: true, data: (await admin.listUsers({ perPage: 100 })).map(publicUser) });
      // Provisioning and role assignment happen in Identity; no arbitrary admin creation API.
      throw new HttpError(410, 'إدارة الحسابات والدعوات والصلاحيات متاحة في لوحة Netlify Identity');
    }
    if (!path.startsWith('/api/sick-leaves')) throw new HttpError(404, 'المسار غير موجود');
    if (!['admin','doctor'].includes(auth.role)) throw new HttpError(403, 'صلاحيات غير كافية');
    if (path.includes('/sync') || new URL(req.url).searchParams.has('sync')) throw new HttpError(410, 'المزامنة الجماعية غير متاحة');
    if (req.method === 'GET') {
      const rows = await scoped(db, auth, tx => tx.select().from(records).where(auth.role === 'admin' ? undefined : eq(records.ownerId, auth.user.id)).limit(500));
      return response({ success: true, count: rows.length, data: rows.map(row => ({ ...open(row.encrypted, row.id), id: row.id })) });
    }
    await throttle(db, context, 'write', 30);
    const target = decodeURIComponent(path.slice('/api/sick-leaves/'.length));
    if (req.method === 'DELETE') {
      if (!/^[a-f0-9-]{36}$/.test(target)) throw new HttpError(400, 'معرف غير صالح');
      const deleted = await scoped(db, auth, tx => tx.delete(records).where(and(eq(records.id, target), auth.role === 'admin' ? undefined : eq(records.ownerId, auth.user.id))).returning({ id: records.id }));
      if (!deleted.length) throw new HttpError(404, 'السجل غير موجود');
      return response({ success: true });
    }
    const data = validateRecord(await jsonBody(req));
    if (req.method === 'POST') {
      const id = crypto.randomUUID(); data.id = id;
      await scoped(db, auth, tx => tx.insert(records).values({ id, ownerId: auth.user.id, lookupHash: lookup(data.PatientId, data.NormalizedServiceCode), encrypted: seal(data, id) }));
      return response({ success: true, data }, 201);
    }
    if (!/^[a-f0-9-]{36}$/.test(target)) throw new HttpError(400, 'معرف غير صالح');
    data.id = target;
    const updated = await scoped(db, auth, tx => tx.update(records).set({ lookupHash: lookup(data.PatientId, data.NormalizedServiceCode), encrypted: seal(data, target), updatedAt: new Date() }).where(and(eq(records.id, target), auth.role === 'admin' ? undefined : eq(records.ownerId, auth.user.id))).returning({ id: records.id }));
    if (!updated.length) throw new HttpError(404, 'السجل غير موجود');
    return response({ success: true, data });
  } catch (error) {
    const failure = error as { code?: string; cause?: {code?: string} };
    const status = error instanceof HttpError ? error.status : failure?.cause?.code === '23505' || failure?.code === '23505' ? 409 : 503;
    return response({ success: false, errorCode: status, message: error instanceof HttpError ? error.message : status === 409 ? 'رمز الخدمة مستخدم بالفعل' : 'الخدمة غير متاحة مؤقتاً', errorMessage: error instanceof HttpError ? error.message : 'الخدمة غير متاحة مؤقتاً' }, status, status === 429 ? { 'Retry-After': '900' } : {});
  }
}
export const config = { path: ['/api/*','/account/loginv3','/Account/loginv3'] };
