import { SickLeave, User, RelationshipOption } from '../types';

export const RELATIONSHIPS: RelationshipOption[] = [
  { id: 1, name: 'أم' },
  { id: 2, name: 'أب' },
  { id: 3, name: 'أخ' },
  { id: 4, name: 'أخت' },
  { id: 5, name: 'ابن' },
  { id: 6, name: 'ابنة' },
  { id: 7, name: 'زوج' },
  { id: 8, name: 'زوجة' },
  { id: 9, name: 'جد' },
  { id: 10, name: 'جدة' },
  { id: 11, name: 'الخال' },
  { id: 12, name: 'العم' },
  { id: 13, name: 'الخالة' },
  { id: 14, name: 'العمة' },
  { id: 15, name: 'ابن الأخت' },
  { id: 16, name: 'ابن الأخ' },
  { id: 17, name: 'ابنة الأخت' },
  { id: 18, name: 'ابنة الأخ' }
];

export const RELATIONSHIP_MAP: Record<number, string> = {
  1: 'أم',
  2: 'أب',
  3: 'أخ',
  4: 'أخت',
  5: 'ابن',
  6: 'ابنة',
  7: 'زوج',
  8: 'زوجة',
  9: 'جد',
  10: 'جدة',
  11: 'الخال',
  12: 'العم',
  13: 'الخالة',
  14: 'العمة',
  15: 'ابن الأخت',
  16: 'ابن الأخ',
  17: 'ابنة الأخت',
  18: 'ابنة الأخ'
};

const SEED_LEAVES: SickLeave[] = [
  {
    id: 'leave-201',
    PatientId: '1098765432',
    NormalizedServiceCode: 'GSL456789',
    PatientName: 'عبدالله محمد الشمري',
    SickLeaveDate: '2026-09-19',
    From: '2026-09-19',
    To: '2026-09-22',
    Duration: 4,
    Hospital: 'مستشفى الملك فهد العام',
    OrganizationName: 'مستشفى الملك فهد العام',
    DoctorName: 'د. أحمد عبدالله الغامدي',
    JobTitle: 'استشاري الباطنية',
    Status: 'نشطة / سارية',
    Notes: 'حالة مرضية تستدعي الراحة التامة',
    isCompanion: false,
    type: 'leave',
    CreatedAt: '2026-09-19T09:52:40.205Z'
  },
  {
    id: 'comp-101',
    PatientId: '1029384756',
    NormalizedServiceCode: 'CMP789123',
    PatientName: 'سعود خالد العتيبي',
    SickLeaveDate: '2026-09-19',
    From: '2026-09-19',
    To: '2026-09-21',
    Duration: 3,
    Hospital: 'مستشفى الملك فهد التخصصي',
    OrganizationName: 'مستشفى الملك فهد التخصصي',
    DoctorName: 'د. ريم فهد المطيري',
    JobTitle: 'استشاري طب الأسرة',
    Status: 'نشطة / سارية',
    Notes: 'مرافقة مريض منوم بالقسم',
    isCompanion: true,
    type: 'companion',
    CompanionName: 'وديان احمد الجدعان',
    'Patient Name': 'وديان احمد الجدعان',
    Relationship: 4,
    RelationshipName: 'أخت',
    CreatedAt: '2026-09-19T09:51:50.497Z'
  },
  {
    id: '1793784551233',
    PatientId: '1126737343',
    NormalizedServiceCode: 'GSL95819190024',
    PatientName: 'رسيل علي عبد الله المقري',
    SickLeaveDate: '2026-10-28',
    From: '2026-10-28',
    To: '2026-10-28',
    Duration: 1,
    Hospital: 'مجمع جراش الطبي',
    OrganizationName: 'مجمع جراش الطبي',
    DoctorName: 'د. خالد إبراهيم الدوسري',
    JobTitle: 'طبيب عام',
    Status: 'نشطة / سارية',
    Notes: '',
    isCompanion: false,
    type: 'leave',
    CreatedAt: '2026-10-28T08:10:00.000Z'
  },
  {
    id: 'comp-102',
    PatientId: '1088776655',
    NormalizedServiceCode: 'CMP654321',
    PatientName: 'فهد عبدالعزيز القحطاني',
    SickLeaveDate: '2026-10-15',
    From: '2026-10-15',
    To: '2026-10-18',
    Duration: 4,
    Hospital: 'مدينة الملك سعود الطبية',
    OrganizationName: 'مدينة الملك سعود الطبية',
    DoctorName: 'د. سارة تركي آل سعود',
    JobTitle: 'استشاري جراحة',
    Status: 'نشطة / سارية',
    Notes: 'مرافق مريض بعد عملية جراحية',
    isCompanion: true,
    type: 'companion',
    CompanionName: 'عبدالعزيز فهد القحطاني',
    'Patient Name': 'عبدالعزيز فهد القحطاني',
    Relationship: 2,
    RelationshipName: 'أب',
    CreatedAt: '2026-10-15T11:20:00.000Z'
  }
];

const STORAGE_KEY = 'seha_clean_leaves_v6';
const USERS_STORAGE_KEY = 'seha_users_v2';
const AUTH_KEY = 'seha_logged_in_user';

export function getStoredLeaves(): SickLeave[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading from localStorage', e);
  }
  // Initialize with seed
  setStoredLeaves(SEED_LEAVES);
  return SEED_LEAVES;
}

export function setStoredLeaves(leaves: SickLeave[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
    // Asynchronously sync with backend if available
    fetch('/api/sick-leaves/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaves })
    }).catch(() => {});
  } catch (e) {
    console.warn('Error saving to localStorage', e);
  }
}

export function findSickLeave(patientId: string, serviceCode: string): SickLeave | undefined {
  const cleanId = String(patientId || '').trim();
  const cleanCode = String(serviceCode || '').trim().toLowerCase();

  if (!cleanId || !cleanCode) return undefined;

  const leaves = getStoredLeaves();
  return leaves.find(l => {
    const pMatch = String(l.PatientId || '').trim() === cleanId;
    const cMatch = String(l.NormalizedServiceCode || '').trim().toLowerCase() === cleanCode;
    return pMatch && cMatch;
  });
}

export function saveSickLeave(leave: SickLeave, isEdit = false): SickLeave[] {
  const leaves = getStoredLeaves();
  const targetCode = String(leave.NormalizedServiceCode).trim().toLowerCase();
  const targetId = String(leave.id).trim().toLowerCase();

  const index = leaves.findIndex(l =>
    (l.NormalizedServiceCode && String(l.NormalizedServiceCode).trim().toLowerCase() === targetCode) ||
    (l.id && String(l.id).trim().toLowerCase() === targetId)
  );

  const updatedItem: SickLeave = {
    ...leave,
    UpdatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    leaves[index] = { ...leaves[index], ...updatedItem };
  } else {
    leaves.unshift({
      ...updatedItem,
      id: updatedItem.id || String(Date.now()),
      CreatedAt: updatedItem.CreatedAt || new Date().toISOString()
    });
  }

  setStoredLeaves(leaves);

  // Sync to API
  const apiEndpoint = isEdit ? `/api/sick-leaves/${encodeURIComponent(leave.id || leave.NormalizedServiceCode)}` : '/api/sick-leaves';
  fetch(apiEndpoint, {
    method: isEdit ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leave)
  }).catch(() => {});

  return leaves;
}

export function deleteSickLeave(idOrCode: string): SickLeave[] {
  const leaves = getStoredLeaves();
  const target = String(idOrCode).trim().toLowerCase();

  const filtered = leaves.filter(l =>
    String(l.id).trim().toLowerCase() !== target &&
    String(l.NormalizedServiceCode).trim().toLowerCase() !== target
  );

  setStoredLeaves(filtered);

  // Sync to API
  fetch(`/api/sick-leaves/${encodeURIComponent(idOrCode)}`, {
    method: 'DELETE'
  }).catch(() => {});

  return filtered;
}

export function generateServiceCode(isCompanion = false): string {
  const prefix = isCompanion ? 'CMP' : 'GSL';
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${digits}`;
}

export function calculateDaysBetween(fromStr: string, toStr: string): number {
  if (!fromStr || !toStr) return 1;
  const d1 = new Date(fromStr);
  const d2 = new Date(toStr);
  const diffTime = d2.getTime() - d1.getTime();
  if (isNaN(diffTime) || diffTime < 0) return 1;
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

// User Accounts Management
const DEFAULT_USERS: User[] = [
  { username: '77899900', password: '77889900', name: 'المسؤول العام', role: 'admin' },
  { username: '77889900', password: '77889900', name: 'مسؤول النظام', role: 'admin' }
];

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveUser(user: User): User[] {
  const users = getStoredUsers();
  const existing = users.findIndex(u => u.username === user.username);
  if (existing >= 0) {
    users[existing] = { ...users[existing], ...user };
  } else {
    users.push({ ...user, createdAt: new Date().toISOString() });
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return users;
}

export function deleteUser(username: string): User[] {
  let users = getStoredUsers();
  if (users.length <= 1) return users;
  users = users.filter(u => u.username !== username);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return users;
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem('seha_logged_in', 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('seha_logged_in');
  }
}
