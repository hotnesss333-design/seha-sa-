import fs from 'fs';
import path from 'path';

const TMP_PATH = path.join('/tmp', 'sick_leaves.json');
const CWD_PATH = path.join(process.cwd(), 'data', 'sick_leaves.json');
const BACKUP_PATH = path.join(process.cwd(), 'data', 'sick_leaves_backup.json');

const readLeavesSync = () => {
  const paths = [TMP_PATH, CWD_PATH, BACKUP_PATH];
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

const getLeaves = async () => readLeavesSync();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const patientId = String(req.query.PatientId || req.query.id || req.query.IDNumber || req.body?.PatientId || '').trim();
  const serviceCode = String(req.query.NormalizedServiceCode || req.query.code || req.query.LeaveId || req.body?.NormalizedServiceCode || '').trim().toLowerCase();

  if (!patientId || !serviceCode) {
    return res.status(200).json([]);
  }

  const leaves = await getLeaves();

  const matches = leaves.filter(l => {
    const lId = String(l.PatientId || l.id || '').trim();
    const lCode = String(l.NormalizedServiceCode || l.LeaveId || '').trim().toLowerCase();
    const idMatch = lId === patientId;
    const codeMatch = lCode === serviceCode;
    return idMatch && codeMatch;
  });

  return res.status(200).json(matches);
}
