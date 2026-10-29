import {
  jsonResponse, getAdminSession, sessionCookieHeader, clearSessionCookieHeader,
  createSessionToken
} from './_lib/security.js';

// GET /Account/GetJWTUserToken — reports whether a valid session exists.
// The frontend expects { ErrorCode: 0, Data: { Token } } on success and
// { ErrorCode: 100 } when there is no valid session.
export default async function handler(request, context) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);

  if (url.pathname.toLowerCase().includes('logout')) {
    return jsonResponse(
      { success: true, message: 'تم تسجيل الخروج' },
      200,
      { 'Set-Cookie': clearSessionCookieHeader() }
    );
  }

  const session = await getAdminSession(request);
  if (session) {
    const token = await createSessionToken(session.username);
    return jsonResponse(
      { ErrorCode: 0, Data: { Token: token } },
      200,
      { 'Set-Cookie': sessionCookieHeader(token) }
    );
  }

  return jsonResponse({ ErrorCode: 100 });
}
