import {
  jsonResponse, rateLimit, rateLimitDb, db, clientIp, isSameOrigin, getAdminSession,
  sessionCookieHeader, clearSessionCookieHeader, createSessionToken,
  verifyPassword, cleanString, findUser, getAllUsers, countUsers,
  createUser, updateUser, deleteUser
} from './_lib/security.js';

const MAX_BODY_BYTES = 16 * 1024;

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { tooLarge: true };
  try {
    return { body: JSON.parse(text || '{}') };
  } catch (e) {
    return { body: {} };
  }
}

function isValidUsername(value) {
  return /^[a-zA-Z0-9_-]{4,20}$/.test(String(value || '').trim());
}

export default async function handler(request, context) {
  const method = request.method;
  const url = new URL(request.url);
  const ip = clientIp(request, context);

  if (method === 'OPTIONS') {
    return new Response('', { status: 204 });
  }

  const limit = rateLimit(`users:${ip}`, 30, 60 * 1000);
  if (!limit.allowed) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429, {
      'Retry-After': String(limit.retryAfter)
    });
  }

  try {
    // -----------------------------------------------------------------------
    // POST /api/users/login and /account/loginv3 — credential verification,
    // issues an HttpOnly signed session cookie.
    // -----------------------------------------------------------------------
    if (method === 'POST' && (url.pathname.toLowerCase().endsWith('/login') || url.pathname.toLowerCase().endsWith('/loginv3'))) {
      const loginv3 = url.pathname.toLowerCase().endsWith('/loginv3');
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ errorCode: 100, errorMessage: 'Invalid request' }, 413);

      const username = cleanString(body && (body.Username || body.username), 32);
      const password = cleanString(body && (body.Password || body.password), 128);

      let loginLimit;
      try {
        loginLimit = await rateLimitDb(db(), `login:${ip}`, 10, 900);
      } catch (e) {
        loginLimit = { allowed: true };
      }
      if (!loginLimit.allowed) {
        return jsonResponse({ errorCode: 100, errorMessage: 'عدد محاولات كبير. حاول بعد قليل.' }, 429, {
          'Retry-After': String(loginLimit.retryAfter)
        });
      }

      if (!username || !password) {
        return jsonResponse({ errorCode: 100, errorMessage: 'بيانات الدخول غير صحيحة' }, 401);
      }

      const user = await findUser(username);
      const valid = user && verifyPassword(password, user.password_salt, user.password_hash);

      if (!valid) {
        // Constant-ish delay to blunt timing and brute-force attempts.
        await new Promise(resolve => setTimeout(resolve, 400));
        return jsonResponse({ errorCode: 100, errorMessage: 'بيانات الدخول غير صحيحة' }, 401);
      }

      const token = await createSessionToken(user.username);
      const responseBody = loginv3
        ? {
            errorCode: 0,
            errorMessage: null,
            data: {
              sendVerificationCode: false,
              userRole: [{ RoleId: 1, RoleName: 'Admin', OrganizationId: '1' }],
              userName: user.username,
              name: user.name,
              token
            }
          }
        : { errorCode: 0, data: { userName: user.username, token } };
      return jsonResponse(responseBody, 200, { 'Set-Cookie': sessionCookieHeader(token) });
    }

    // -----------------------------------------------------------------------
    // Everything below requires an admin session
    // -----------------------------------------------------------------------
    const session = await getAdminSession(request);
    if (!session) {
      return jsonResponse({ errorCode: 100, error: 'Unauthorized' }, 401);
    }
    if (method !== 'GET' && !isSameOrigin(request)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // GET /api/users — list users (never exposes passwords)
    if (method === 'GET') {
      const users = await getAllUsers();
      return jsonResponse({ success: true, data: users });
    }

    // POST /api/users — add user (admin)
    if (method === 'POST') {
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ error: 'Payload too large' }, 413);
      const username = cleanString(body && (body.username || body.Username), 32);
      const name = cleanString(body && (body.name || body.Name), 100);
      const password = cleanString(body && (body.password || body.Password), 128);
      if (!isValidUsername(username)) {
        return jsonResponse({ success: false, message: 'اسم المستخدم غير صالح' }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ success: false, message: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' }, 400);
      }
      if (await findUser(username)) {
        return jsonResponse({ success: false, message: 'المستخدم موجود مسبقاً' }, 409);
      }
      await createUser({ username, name, role: 'admin', password });
      return jsonResponse({ success: true, message: 'تمت إضافة المستخدم بنجاح' }, 201);
    }

    // PUT /api/users/:username — update credentials (admin)
    if (method === 'PUT') {
      const target = cleanString(decodeURIComponent(url.pathname.split('/').pop() || ''), 32);
      const { body, tooLarge } = await readJson(request);
      if (tooLarge) return jsonResponse({ error: 'Payload too large' }, 413);
      const newUsername = cleanString(body && (body.newUsername || body.username), 32);
      const newPassword = cleanString(body && (body.newPassword || body.password), 128);
      if (newUsername && !isValidUsername(newUsername)) {
        return jsonResponse({ success: false, message: 'اسم المستخدم غير صالح' }, 400);
      }
      if (newPassword && newPassword.length < 6) {
        return jsonResponse({ success: false, message: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' }, 400);
      }
      if (!(await findUser(target))) {
        return jsonResponse({ success: false, message: 'المستخدم غير موجود' }, 404);
      }
      await updateUser(target, { newUsername, password: newPassword });
      return jsonResponse({ success: true, message: 'تم تحديث المستخدم' });
    }

    // DELETE /api/users/:username — remove user (admin, last account protected)
    if (method === 'DELETE') {
      const target = cleanString(decodeURIComponent(url.pathname.split('/').pop() || ''), 32);
      if ((await countUsers()) <= 1) {
        return jsonResponse({ success: false, message: 'لا يمكن حذف المسؤول الرئيسي' }, 400);
      }
      const deleted = await deleteUser(target);
      if (!deleted) {
        return jsonResponse({ success: false, message: 'المستخدم غير موجود' }, 404);
      }
      return jsonResponse({ success: true, message: 'تم حذف المستخدم' });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('users failed:', err && err.message);
    return jsonResponse({ errorCode: 100, error: 'Service temporarily unavailable' }, 503);
  }
}
