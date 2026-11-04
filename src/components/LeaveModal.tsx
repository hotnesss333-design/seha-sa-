import React, { useState, useEffect } from 'react';
import { SickLeave } from '../types';
import { 
  RELATIONSHIPS, 
  generateServiceCode, 
  calculateDaysBetween 
} from '../services/storage';
import { X, RefreshCw, UserCheck, HeartPulse, Building2, Calendar, Stethoscope, AlertCircle } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leave: SickLeave, isEdit: boolean) => void;
  initialLeave?: SickLeave | null;
  defaultType?: 'leave' | 'companion';
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLeave,
  defaultType = 'leave'
}) => {
  const isEdit = !!initialLeave;

  const [isCompanion, setIsCompanion] = useState(
    initialLeave ? !!(initialLeave.isCompanion || initialLeave.type === 'companion' || initialLeave.CompanionName) : defaultType === 'companion'
  );

  const today = new Date().toISOString().split('T')[0];

  const [serviceCode, setServiceCode] = useState(initialLeave?.NormalizedServiceCode || generateServiceCode(defaultType === 'companion'));
  const [patientId, setPatientId] = useState(initialLeave?.PatientId || '');
  const [patientName, setPatientName] = useState(initialLeave?.PatientName || '');
  const [companionName, setCompanionName] = useState(initialLeave?.CompanionName || initialLeave?.['Patient Name'] || '');
  const [relationshipId, setRelationshipId] = useState<number>(Number(initialLeave?.Relationship) || 1);
  const [fromDate, setFromDate] = useState(initialLeave?.From || today);
  const [toDate, setToDate] = useState(initialLeave?.To || today);
  const [duration, setDuration] = useState<number>(initialLeave?.Duration || 1);
  const [hospital, setHospital] = useState(initialLeave?.Hospital || initialLeave?.OrganizationName || 'مستشفى الملك فهد العام');
  const [doctorName, setDoctorName] = useState(initialLeave?.DoctorName || initialLeave?.['Doctor NAME'] || 'د. محمد علي عسيري');
  const [jobTitle, setJobTitle] = useState(initialLeave?.JobTitle || 'استشاري طب الأسرة');
  const [status, setStatus] = useState(initialLeave?.Status || 'نشطة / سارية');
  const [notes, setNotes] = useState(initialLeave?.Notes || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialLeave) {
      const comp = !!(initialLeave.isCompanion || initialLeave.type === 'companion' || initialLeave.CompanionName);
      setIsCompanion(comp);
      setServiceCode(initialLeave.NormalizedServiceCode);
      setPatientId(initialLeave.PatientId);
      setPatientName(initialLeave.PatientName);
      setCompanionName(initialLeave.CompanionName || initialLeave['Patient Name'] || '');
      setRelationshipId(Number(initialLeave.Relationship) || 1);
      setFromDate(initialLeave.From || today);
      setToDate(initialLeave.To || today);
      setDuration(initialLeave.Duration || 1);
      setHospital(initialLeave.Hospital || initialLeave.OrganizationName || 'مستشفى الملك فهد العام');
      setDoctorName(initialLeave.DoctorName || initialLeave['Doctor NAME'] || 'د. محمد علي عسيري');
      setJobTitle(initialLeave.JobTitle || 'استشاري طب الأسرة');
      setStatus(initialLeave.Status || 'نشطة / سارية');
      setNotes(initialLeave.Notes || '');
    } else {
      const comp = defaultType === 'companion';
      setIsCompanion(comp);
      setServiceCode(generateServiceCode(comp));
      setPatientId('');
      setPatientName('');
      setCompanionName('');
      setRelationshipId(1);
      setFromDate(today);
      setToDate(today);
      setDuration(1);
      setHospital('مستشفى الملك فهد العام');
      setDoctorName('د. محمد علي عسيري');
      setJobTitle('استشاري طب الأسرة');
      setStatus('نشطة / سارية');
      setNotes('');
    }
    setError('');
  }, [initialLeave, defaultType, isOpen]);

  // Handle date changes to auto calculate duration
  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    const d = calculateDaysBetween(val, toDate);
    setDuration(d);
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    const d = calculateDaysBetween(fromDate, val);
    setDuration(d);
  };

  const handleTypeSwitch = (companionMode: boolean) => {
    setIsCompanion(companionMode);
    if (!isEdit) {
      setServiceCode(generateServiceCode(companionMode));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCode.trim()) {
      setError('يرجى إدخال أو توليد رمز الخدمة');
      return;
    }
    if (!patientId.trim()) {
      setError('يرجى إدخال رقم الهوية أو الإقامة للمريض');
      return;
    }
    if (!patientName.trim()) {
      setError('يرجى إدخال اسم المريض');
      return;
    }
    if (isCompanion && !companionName.trim()) {
      setError('يرجى إدخال اسم المرافق');
      return;
    }

    const relObj = RELATIONSHIPS.find(r => r.id === relationshipId);

    const leaveData: SickLeave = {
      id: initialLeave?.id || String(Date.now()),
      PatientId: patientId.trim(),
      NormalizedServiceCode: serviceCode.trim().toUpperCase(),
      PatientName: patientName.trim(),
      SickLeaveDate: initialLeave?.SickLeaveDate || fromDate,
      From: fromDate,
      To: toDate,
      Duration: duration,
      Hospital: hospital.trim(),
      OrganizationName: hospital.trim(),
      DoctorName: doctorName.trim(),
      'Doctor NAME': doctorName.trim(),
      JobTitle: jobTitle.trim(),
      Status: status,
      Notes: notes.trim(),
      isCompanion: isCompanion,
      type: isCompanion ? 'companion' : 'leave',
      ...(isCompanion ? {
        CompanionName: companionName.trim(),
        'Patient Name': companionName.trim(),
        Relationship: relationshipId,
        RelationshipName: relObj ? relObj.name : ''
      } : {
        CompanionName: '',
        'Patient Name': '',
        Relationship: null,
        RelationshipName: ''
      }),
      CreatedAt: initialLeave?.CreatedAt || new Date().toISOString()
    };

    onSave(leaveData, isEdit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isEdit ? 'تعديل بيانات التقرير' : 'إصدار تقرير جديد'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تسجيل التقرير في قاعدة بيانات وزارة الصحة المعتمدة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="p-6 pb-2">
          <label className="text-xs font-bold text-slate-700 block mb-2">نوع التقرير المراد إصداره:</label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeSwitch(false)}
              className={`py-2.5 px-4 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                !isCompanion
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              إجازة مرضية
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch(true)}
              className={`py-2.5 px-4 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                isCompanion
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              مرافق مريض
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Code & Patient ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">رمز الخدمة (Service Code)</label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setServiceCode(generateServiceCode(isCompanion))}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> توليد جديد
                  </button>
                )}
              </div>
              <input
                type="text"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                placeholder="GSL..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهوية / الإقامة للمريض</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="10XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Patient Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">اسم المريض المستفيد</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="الاسم الرباعي للمريض"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Companion fields if enabled */}
          {isCompanion && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                بيانات مرافق المريض
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">اسم المرافق</label>
                  <input
                    type="text"
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    placeholder="اسم المرافق كاملاً"
                    className="w-full px-3.5 py-2 bg-white rounded-lg border border-emerald-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required={isCompanion}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">صلة القرابة</label>
                  <select
                    value={relationshipId}
                    onChange={(e) => setRelationshipId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white rounded-lg border border-emerald-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel.id} value={rel.id}>
                        {rel.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ البداية (من)</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ النهاية (إلى)</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">المدة (بالأيام)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Hospital / Clinic */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">المنشأة الطبية (المستشفى / المركز الصحي)</label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="مثال: مستشفى الملك فهد العام"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Doctor Name & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">اسم الطبيب المعالج</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="د. ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">المسمى الوظيفي للطبيب</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="استشاري / أخصائي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">حالة التقرير</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="نشطة / سارية">نشطة / سارية</option>
                <option value="معتمدة">معتمدة</option>
                <option value="منتهية">منتهية</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات إضافية (اختياري)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات طبية..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-md transition"
            >
              {isEdit ? 'حفظ التعديلات' : 'إصدار التقرير وحفظه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
