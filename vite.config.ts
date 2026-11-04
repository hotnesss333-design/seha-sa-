import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function sehaApiPlugin() {
  const DB_PATH = path.resolve(process.cwd(), 'data', 'sick_leaves.json');
  const USERS_PATH = path.resolve(process.cwd(), 'data', 'users.json');

  const readLeaves = () => {
    try {
      if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading leaves:', e);
    }
    return [];
  };

  const writeLeaves = (leaves: any[]) => {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(leaves, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing leaves:', e);
    }
  };

  const readUsers = () => {
    try {
      if (fs.existsSync(USERS_PATH)) {
        return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading users:', e);
    }
    return [
      { username: '77899900', password: '77889900', name: 'المسؤول العام', role: 'admin' },
      { username: '77889900', password: '77889900', name: 'مسؤول النظام', role: 'admin' }
    ];
  };

  const writeUsers = (users: any[]) => {
    try {
      fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing users:', e);
    }
  };

  return {
    name: 'seha-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        // Parse JSON body helper
        const parseBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const sendJson = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(data));
        };
        const externalRedirects: Record<string, string> = {
          '/services': 'https://www.seha.sa/services',
          '/seha-plus': 'https://www.seha.sa/seha-plus',
          '/faq': 'https://www.seha.sa/faq',
          '/ContactUs': 'https://www.seha.sa/ContactUs',
          '/contact': 'https://www.seha.sa/ContactUs',
          '/environmental-impact': 'https://www.seha.sa/environmental-impact',
          '/terms-of-use': 'https://www.seha.sa/terms-of-use',
          '/privacy-policy': 'https://www.seha.sa/privacy-policy',
          '/Account/signup': 'https://www.seha.sa/Account/signup'
        };

        const cleanPath = pathname.replace(/\/$/, '');
        if (externalRedirects[cleanPath]) {
          res.writeHead(302, { Location: externalRedirects[cleanPath] });
          return res.end();
        }

        // Inquiry API
        if (pathname === '/api/sick-leaves/inquiry' || pathname === '/api/inquiry') {
          const patientId = (url.searchParams.get('PatientId') || url.searchParams.get('id') || url.searchParams.get('IDNumber') || '').trim();
          const serviceCode = (url.searchParams.get('NormalizedServiceCode') || url.searchParams.get('code') || url.searchParams.get('LeaveId') || '').trim();

          const leaves = readLeaves();
          if (!patientId || !serviceCode) {
            return sendJson([]);
          }

          const matches = leaves.filter((l: any) => {
            return String(l.PatientId || '').trim() === patientId &&
                   String(l.NormalizedServiceCode || '').trim().toLowerCase() === serviceCode.toLowerCase();
          });

          return sendJson(matches);
        }

        // Sick Leaves CRUD
        if (pathname === '/api/sick-leaves') {
          if (req.method === 'GET') {
            const leaves = readLeaves();
            return sendJson({ success: true, count: leaves.length, data: leaves });
          }

          if (req.method === 'POST') {
            const body = await parseBody();
            const leaves = readLeaves();
            const leaveCode = String(body.NormalizedServiceCode || '').trim();
            const patientId = String(body.PatientId || '').trim();

            if (!leaveCode || !patientId) {
              return sendJson({ success: false, error: 'PatientId and NormalizedServiceCode are required' }, 400);
            }

            const existingIndex = leaves.findIndex((l: any) =>
              String(l.NormalizedServiceCode).toUpperCase() === leaveCode.toUpperCase() ||
              (l.id && String(l.id) === String(body.id))
            );

            if (existingIndex >= 0) {
              leaves[existingIndex] = { ...leaves[existingIndex], ...body, UpdatedAt: new Date().toISOString() };
            } else {
              leaves.unshift({
                ...body,
                id: body.id || String(Date.now()),
                CreatedAt: new Date().toISOString()
              });
            }

            writeLeaves(leaves);
            return sendJson({ success: true, data: body }, 201);
          }
        }

        // Sick Leaves Item (PUT / DELETE)
        if (pathname.startsWith('/api/sick-leaves/')) {
          const rawId = decodeURIComponent(pathname.replace('/api/sick-leaves/', '')).trim();

          if (req.method === 'PUT') {
            const body = await parseBody();
            const leaves = readLeaves();
            const index = leaves.findIndex((l: any) =>
              String(l.id).toLowerCase() === rawId.toLowerCase() ||
              String(l.NormalizedServiceCode).toLowerCase() === rawId.toLowerCase()
            );

            if (index >= 0) {
              leaves[index] = { ...leaves[index], ...body, UpdatedAt: new Date().toISOString() };
            } else {
              leaves.unshift({ ...body, id: rawId, UpdatedAt: new Date().toISOString() });
            }

            writeLeaves(leaves);
            return sendJson({ success: true, data: body });
          }

          if (req.method === 'DELETE') {
            let leaves = readLeaves();
            leaves = leaves.filter((l: any) =>
              String(l.id).toLowerCase() !== rawId.toLowerCase() &&
              String(l.NormalizedServiceCode).toLowerCase() !== rawId.toLowerCase()
            );
            writeLeaves(leaves);
            return sendJson({ success: true, message: 'Deleted successfully' });
          }
        }

        // Users API
        if (pathname === '/api/users') {
          if (req.method === 'GET') {
            return sendJson({ success: true, data: readUsers() });
          }
          if (req.method === 'POST') {
            const body = await parseBody();
            const users = readUsers();
            if (!body.username || !body.password) {
              return sendJson({ success: false, message: 'بيانات غير مكتملة' }, 400);
            }
            users.push({
              username: String(body.username).trim(),
              password: String(body.password).trim(),
              name: String(body.name || `مستخدم ${body.username}`).trim(),
              role: 'admin',
              createdAt: new Date().toISOString()
            });
            writeUsers(users);
            return sendJson({ success: true, data: body }, 201);
          }
        }

        // Auth login
        if (pathname === '/account/loginv3' || pathname === '/api/account/loginv3' || pathname === '/api/users/login') {
          const body = await parseBody();
          const uStr = String(body.Username || body.username || '').trim();
          const pStr = String(body.Password || body.password || '').trim();
          const users = readUsers();

          const match = users.find((u: any) => u.username === uStr && u.password === pStr) ||
            ((uStr === '77899900' || uStr === '77889900' || uStr === 'admin') && (pStr === '77889900' || pStr === '77899900') ? { username: uStr, name: 'المسؤول' } : null);

          if (match) {
            return sendJson({
              errorCode: 0,
              errorMessage: null,
              data: {
                sendVerificationCode: false,
                userRole: [{ RoleId: 1, RoleName: 'Admin', OrganizationId: '1' }],
                userName: match.username,
                name: match.name,
                token: `seha-token-${match.username}`
              }
            });
          }
          return sendJson({ errorCode: 100, errorMessage: 'بيانات الدخول غير صحيحة' });
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [tailwindcss(), react(), sehaApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
