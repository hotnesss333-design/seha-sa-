import { db } from "../../db/index.js";
import { users, sessions, loginAttempts } from "../../db/schema.js";
import { eq, and, gte, sql, count } from "drizzle-orm";
import crypto from "node:crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extraHeaders },
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const computed = crypto.scryptSync(String(password), parts[1], 64).toString("hex");
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(parts[2], "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function getClientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
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

async function getAuthenticatedUsername(request) {
  let token = "";
  const cookies = parseCookies(request);
  if (cookies["seha_session"]) token = cookies["seha_session"];
  const authHeader = request.headers.get("authorization") || "";
  if (!token && authHeader.toLowerCase().startsWith("bearer ")) token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tokenHash, sha256(token)), gte(sessions.expiresAt, new Date())))
      .limit(1);
    return rows.length > 0 ? rows[0].username : null;
  } catch (e) {
    return null;
  }
}

async function createSession(username) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash: sha256(token), token, username, expiresAt });
  return token;
}

function sessionCookie(token) {
  return `seha_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

const CLEAR_COOKIE = "seha_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

async function isRateLimited(ip) {
  try {
    const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
    const rows = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false), gte(loginAttempts.createdAt, since)));
    return Number(rows[0]?.value || 0) >= MAX_FAILED_ATTEMPTS;
  } catch (e) {
    return false;
  }
}

async function recordAttempt(ip, username, success) {
  try {
    await db.insert(loginAttempts).values({ ip, username: String(username || "").slice(0, 128), success });
    // Housekeeping: drop attempt records older than 24 hours
    await db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} < NOW() - INTERVAL '24 hours'`);
  } catch (e) {}
}

function safeUser(u) {
  return { username: u.username, name: u.name, role: u.role, createdAt: u.createdAt };
}

async function handle(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // ---------- Public endpoints (rate limited) ----------
  if (path === "/api/users/login" && method === "POST") {
    const ip = getClientIp(request);
    if (await isRateLimited(ip)) {
      return jsonResponse(
        { errorCode: 100, errorMessage: "تم إيقاف تسجيل الدخول مؤقتاً بسبب محاولات متكررة، يرجى المحاولة لاحقاً" },
        429
      );
    }
    let body: any = {};
    try { body = await request.json(); } catch (e) {}
    const username = String(body.Username || body.username || "").trim();
    const password = String(body.Password || body.password || "");
    if (!username || !password) {
      await recordAttempt(ip, username, false);
      return jsonResponse({ errorCode: 100, errorMessage: "بيانات الدخول غير صحيحة" }, 200);
    }
    let matched = null;
    try {
      const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (rows.length > 0 && verifyPassword(password, rows[0].passwordHash)) {
        matched = rows[0];
      }
    } catch (e) {
      matched = null;
    }
    if (!matched) {
      await recordAttempt(ip, username, false);
      // Uniform response and status so attackers cannot enumerate valid usernames
      return jsonResponse({ errorCode: 100, errorMessage: "بيانات الدخول غير صحيحة" }, 200);
    }
    await recordAttempt(ip, username, true);
    const token = await createSession(matched.username);
    return jsonResponse(
      {
        errorCode: 0,
        errorMessage: null,
        data: {
          sendVerificationCode: false,
          userRole: [{ RoleId: 1, RoleName: "Admin", OrganizationId: "1" }],
          userName: matched.username,
          name: matched.name,
          token,
        },
      },
      200,
      { "Set-Cookie": sessionCookie(token) }
    );
  }

  if (path === "/api/users/verify" && method === "GET") {
    const username = await getAuthenticatedUsername(request);
    if (!username) {
      return jsonResponse({ errorCode: 100, ErrorCode: 100, errorMessage: "لا توجد جلسة فعالة" }, 200);
    }
    let token = "";
    const cookies = parseCookies(request);
    const authHeader = request.headers.get("authorization") || "";
    if (cookies["seha_session"]) token = cookies["seha_session"];
    else if (authHeader.toLowerCase().startsWith("bearer ")) token = authHeader.slice(7).trim();
    return jsonResponse(
      { errorCode: 0, ErrorCode: 0, data: { userName: username }, Data: { Token: token } },
      200
    );
  }

  if (path === "/api/users/logout" && method === "POST") {
    let token = "";
    const cookies = parseCookies(request);
    const authHeader = request.headers.get("authorization") || "";
    if (cookies["seha_session"]) token = cookies["seha_session"];
    else if (authHeader.toLowerCase().startsWith("bearer ")) token = authHeader.slice(7).trim();
    if (token) {
      try { await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token))); } catch (e) {}
    }
    return jsonResponse({ errorCode: 0, success: true }, 200, { "Set-Cookie": CLEAR_COOKIE });
  }

  // ---------- Session-protected user management ----------
  const authUsername = await getAuthenticatedUsername(request);
  const requiresAuth = ["/api/users", "/api/users/"].some((p) => path === p || path.startsWith(p));
  const isPublicPath = ["/api/users/login", "/api/users/verify", "/api/users/logout"].some((p) => path === p);

  if (requiresAuth && !isPublicPath && !authUsername) {
    return jsonResponse({ success: false, errorCode: 401, message: "غير مصرح لك بالوصول" }, 401);
  }

  if (path === "/api/users" && method === "GET") {
    const rows = await db.select().from(users).orderBy(users.id);
    return jsonResponse({ success: true, data: rows.map(safeUser) }, 200);
  }

  if (path === "/api/users" && method === "POST") {
    let body: any = {};
    try { body = await request.json(); } catch (e) {}
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();
    const name = String(body.name || "").trim() || `مستخدم ${username}`;
    if (!username || !password) {
      return jsonResponse({ success: false, message: "يرجى إدخال اسم المستخدم/رقم الهوية وكلمة المرور" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ success: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
    }
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return jsonResponse({ success: false, message: "المستخدم موجود بالفعل" }, 400);
    }
    const [created] = await db
      .insert(users)
      .values({ username, passwordHash: hashPassword(password), name, role: "admin" })
      .returning();
    return jsonResponse({ success: true, message: "تمت إضافة المستخدم بنجاح", data: safeUser(created) }, 201);
  }

  const updateUserMatch = path.match(/^\/api\/users\/([^/]+)$/);
  if (updateUserMatch && method === "PUT") {
    const target = decodeURIComponent(updateUserMatch[1]).trim();
    let body: any = {};
    try { body = await request.json(); } catch (e) {}
    const newUsername = String(body.newUsername || "").trim();
    const newPassword = String(body.newPassword || "").trim();
    const newName = String(body.name || "").trim();
    const rows = await db.select().from(users).where(eq(users.username, target)).limit(1);
    if (rows.length === 0) {
      return jsonResponse({ success: false, message: "المستخدم غير موجود" }, 404);
    }
    const updates: any = { updatedAt: new Date() };
    if (newUsername && newUsername !== target) {
      const clash = await db.select().from(users).where(eq(users.username, newUsername)).limit(1);
      if (clash.length > 0) {
        return jsonResponse({ success: false, message: "اسم المستخدم الجديد مستخدم بالفعل" }, 400);
      }
      updates.username = newUsername;
    }
    if (newPassword) {
      if (newPassword.length < 8) {
        return jsonResponse({ success: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
      }
      updates.passwordHash = hashPassword(newPassword);
      // Invalidate all other sessions of this user after a credential change
      await db.delete(sessions).where(eq(sessions.username, target));
      const token = await createSession(updates.username || target);
      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.username, target))
        .returning();
      return jsonResponse(
        { success: true, message: "تم تحديث البيانات بنجاح", data: safeUser(updated) },
        200,
        { "Set-Cookie": sessionCookie(token) }
      );
    }
    if (newName) updates.name = newName;
    const [updated] = await db.update(users).set(updates).where(eq(users.username, target)).returning();
    return jsonResponse({ success: true, message: "تم تحديث البيانات بنجاح", data: safeUser(updated) }, 200);
  }

  if (updateUserMatch && method === "DELETE") {
    const target = decodeURIComponent(updateUserMatch[1]).trim();
    const total = await db.select({ value: count() }).from(users);
    if (Number(total[0]?.value || 0) <= 1) {
      return jsonResponse({ success: false, message: "لا يمكن حذف آخر مسؤول متبقي للنظام" }, 400);
    }
    if (target === authUsername) {
      return jsonResponse({ success: false, message: "لا يمكن حذف الحساب المستخدم حالياً" }, 400);
    }
    await db.delete(users).where(eq(users.username, target));
    await db.delete(sessions).where(eq(sessions.username, target));
    return jsonResponse({ success: true, message: "تم حذف المستخدم بنجاح" }, 200);
  }

  return jsonResponse({ success: false, message: "طلب غير معروف" }, 404);
}

export default async (request: Request) => {
  try {
    return await handle(request);
  } catch (e) {
    return jsonResponse({ success: false, errorCode: 500, message: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً" }, 500);
  }
};
