export interface SickLeave {
  id: string;
  PatientId: string;
  NormalizedServiceCode: string;
  PatientName: string;
  SickLeaveDate: string;
  From: string;
  To: string;
  Duration: number;
  Hospital: string;
  OrganizationName?: string;
  DoctorName: string;
  'Doctor NAME'?: string;
  JobTitle: string;
  Status: string;
  Notes?: string;
  isCompanion?: boolean;
  type?: 'leave' | 'companion' | string;
  CompanionName?: string;
  'Patient Name'?: string;
  Relationship?: number | string | null;
  RelationshipName?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface User {
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'doctor' | 'user';
  createdAt?: string;
}

export interface RelationshipOption {
  id: number;
  name: string;
}

export type ActiveView = 'inquiry' | 'dashboard' | 'login';
export type ActiveTab = ActiveView;

// Exact URLs matching the reference file from the user's zip (with hash routing #/)
export const SEHA_EXTERNAL_URLS = {
  home: 'https://www.seha.sa/#/',
  services: 'https://www.seha.sa/#/services',
  sehaPlus: 'https://www.seha.sa/#/seha-plus',
  inquiries: 'https://www.seha.sa/#/inquiries',
  faq: 'https://www.seha.sa/#/faq',
  signup: 'https://www.seha.sa/#/account/signup',
  environmentalImpact: 'https://www.seha.sa/#/environmental-impact',
  contactUs: 'https://www.seha.sa/#/ContactUs',
  terms: 'https://www.seha.sa/#/terms-of-use',
  privacy: 'https://www.seha.sa/#/privacy-policy'
};
