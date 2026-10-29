import fs from 'fs';
import path from 'path';

const TMP_PATH = path.join('/tmp', 'sick_leaves.json');
const CWD_PATH = path.join(process.cwd(), 'data', 'sick_leaves.json');
const BACKUP_PATH = path.join(process.cwd(), 'data', 'sick_leaves_backup.json');

const readLeavesSync = () => {
  const paths = [TMP_PATH, CWD_PATH];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(content || '[]');
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [];
};

const writeLeavesSync = (leaves) => {
  const content = JSON.stringify(leaves, null, 2);
  let saved = false;

  try {
    fs.writeFileSync(TMP_PATH, content, 'utf8');
    saved = true;
  } catch (e) {}

  try {
    const dir = path.dirname(CWD_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CWD_PATH, content, 'utf8');
    saved = true;
  } catch (e) {}

  return saved;
};

const getLeaves = async () => readLeavesSync();

const saveLeaves = async (leaves) => writeLeavesSync(leaves);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = req.method;
  const leaves = await getLeaves();

  // GET /api/sick-leaves
  if (method === 'GET') {
    return res.status(200).json({ success: true, count: leaves.length, data: leaves });
  }

  // POST /api/sick-leaves
  if (method === 'POST') {
    if (req.query.sync || (req.url && req.url.includes('sync'))) {
      const incoming = req.body?.leaves || [];
      if (Array.isArray(incoming) && incoming.length > 0) {
        await saveLeaves(incoming);
      }
      return res.status(200).json({ success: true, message: 'تمت المزامنة بنجاح' });
    }

    const newLeave = req.body || {};
    const codeKey = String(newLeave.NormalizedServiceCode || '').trim().toLowerCase();
    const existingIndex = leaves.findIndex(l => String(l.NormalizedServiceCode || '').trim().toLowerCase() === codeKey);

    if (existingIndex >= 0) {
      leaves[existingIndex] = { ...leaves[existingIndex], ...newLeave, UpdatedAt: new Date().toISOString() };
    } else {
      leaves.unshift({ ...newLeave, CreatedAt: new Date().toISOString() });
    }

    await saveLeaves(leaves);
    return res.status(200).json({ success: true, message: 'تم حفظ الإجازة في قاعدة البيانات بنجاح', data: newLeave });
  }

  // PUT /api/sick-leaves
  if (method === 'PUT') {
    const updatedLeave = req.body || {};
    const targetId = String(req.query.id || updatedLeave.id || updatedLeave.NormalizedServiceCode || '').trim().toLowerCase();
    const index = leaves.findIndex(l => 
      String(l.id || '').trim().toLowerCase() === targetId ||
      String(l.NormalizedServiceCode || '').trim().toLowerCase() === targetId
    );

    if (index >= 0) {
      leaves[index] = { ...leaves[index], ...updatedLeave, UpdatedAt: new Date().toISOString() };
    } else {
      leaves.unshift(updatedLeave);
    }

    await saveLeaves(leaves);
    return res.status(200).json({ success: true, message: 'تم تحديث الإجازة بنجاح', data: updatedLeave });
  }

  // DELETE /api/sick-leaves
  if (method === 'DELETE') {
    const targetId = String(req.query.id || req.body?.id || '').trim().toLowerCase();
    const filtered = leaves.filter(l => 
      String(l.id || '').trim().toLowerCase() !== targetId &&
      String(l.NormalizedServiceCode || '').trim().toLowerCase() !== targetId
    );

    await saveLeaves(filtered);
    return res.status(200).json({ success: true, message: 'تم حذف الإجازة بنجاح' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
