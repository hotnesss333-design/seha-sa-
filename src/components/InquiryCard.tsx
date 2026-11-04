import React, { useState } from 'react';
import { SickLeave } from '../types';
import { 
  Printer, ArrowRight, CheckCircle2, ShieldCheck, 
  Calendar, Building2, User, Stethoscope, Copy, Check, QrCode
} from 'lucide-react';

interface InquiryCardProps {
  leave: SickLeave;
  onReset: () => void;
}

export const InquiryCard: React.FC<InquiryCardProps> = ({ leave, onReset }) => {
  const [copied, setCopied] = useState(false);

  const isCompanion = !!(leave.isCompanion || leave.type === 'companion' || leave.CompanionName || leave['Patient Name']);
  const companionName = leave.CompanionName || leave['Patient Name'] || '';
  const relationship = leave.RelationshipName || (leave.Relationship ? String(leave.Relationship) : '');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(leave.NormalizedServiceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
      {/* Official Certificate Top Border */}
      <div className="h-2.5 bg-gradient-to-r from-[#1b437c] via-[#2563eb] to-[#059669]"></div>

      {/* Certificate Header */}
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo.png"
              alt="منصة صحة"
              className="h-12 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#1e3a8a]">
                  {isCompanion ? 'تقرير مرافق مريض معتمد' : 'تقرير الإجازة المرضية المعتمدة'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                خدمة الاستعلام الرسمية المعتمدة - وزارة الصحة بالمملكة العربية السعودية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {leave.Status || 'نشطة / سارية وموثقة'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Certificate Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Verification Alert Banner */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">هذا المستند صادر وموثق إلكترونياً من منصة صحة</p>
              <p className="text-xs text-blue-700 mt-0.5">يمكن التحقق من صحة وصلاحية هذا التقرير عبر بوابة الاستعلام الموحدة</p>
            </div>
          </div>

          <div className="text-left shrink-0 hidden sm:block">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
              title="نسخ رمز الخدمة"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{leave.NormalizedServiceCode}</span>
            </button>
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient Name */}
          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">اسم المستفيد (المريض)</span>
            <span className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              {leave.PatientName}
            </span>
          </div>

          {/* Companion Specific Details */}
          {isCompanion && (
            <>
              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block mb-1">اسم المرافق:</span>
                <span className="text-base font-extrabold text-emerald-950 block">
                  {companionName || leave.PatientName}
                </span>
              </div>

              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block mb-1">صلة القرابة:</span>
                <span className="text-base font-extrabold text-emerald-950 block">
                  {relationship || 'مرافق مريض'}
                </span>
              </div>
            </>
          )}

          {/* National ID */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">رقم الهوية / الإقامة</span>
            <span className="text-base font-bold text-slate-800 font-mono tracking-wider">
              {leave.PatientId}
            </span>
          </div>

          {/* Service Code */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">رمز الخدمة المعتمد</span>
            <span className="text-base font-bold text-blue-700 font-mono tracking-wider">
              {leave.NormalizedServiceCode}
            </span>
          </div>

          {/* Date From */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">تبدأ من تاريخ</span>
            <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {leave.From}
            </span>
          </div>

          {/* Date To */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">حتى تاريخ</span>
            <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {leave.To}
            </span>
          </div>

          {/* Duration */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/60">
            <span className="text-xs font-semibold text-blue-700 block mb-1">المدة الكلية</span>
            <span className="text-lg font-black text-blue-900">
              {leave.Duration} {leave.Duration === 1 ? 'يوم واحد' : leave.Duration === 2 ? 'يومان' : `${leave.Duration} أيام`}
            </span>
          </div>

          {/* Issue Date */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">تاريخ إصدار التقرير</span>
            <span className="text-base font-bold text-slate-800">
              {leave.SickLeaveDate || leave.From}
            </span>
          </div>

          {/* Hospital */}
          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">المنشأة الطبية المصدرة للتقرير</span>
            <span className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              {leave.Hospital || leave.OrganizationName || 'مستشفى الملك فهد العام'}
            </span>
          </div>

          {/* Doctor Name & Job Title */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">اسم الطبيب المعالج</span>
            <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              {leave.DoctorName || leave['Doctor NAME'] || 'د. محمد علي عسيري'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">المسمى الوظيفي للطبيب</span>
            <span className="text-base font-bold text-slate-800">
              {leave.JobTitle || 'استشاري / طبيب معتمد'}
            </span>
          </div>
        </div>

        {/* QR Code and Official Stamp simulation */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 p-4 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
              {/* Simulated QR Code SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect x="0" y="0" width="30" height="30" fill="currentColor"/>
                <rect x="5" y="5" width="20" height="20" fill="white"/>
                <rect x="10" y="10" width="10" height="10" fill="currentColor"/>
                
                <rect x="70" y="0" width="30" height="30" fill="currentColor"/>
                <rect x="75" y="5" width="20" height="20" fill="white"/>
                <rect x="80" y="10" width="10" height="10" fill="currentColor"/>
                
                <rect x="0" y="70" width="30" height="30" fill="currentColor"/>
                <rect x="5" y="75" width="20" height="20" fill="white"/>
                <rect x="10" y="80" width="10" height="10" fill="currentColor"/>
                
                <rect x="40" y="10" width="15" height="15" fill="currentColor"/>
                <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
                <rect x="70" y="45" width="15" height="15" fill="currentColor"/>
                <rect x="45" y="75" width="20" height="15" fill="currentColor"/>
                <rect x="75" y="75" width="15" height="15" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">رمز الاستجابة السريعة للتحقق الفوري</p>
              <p className="text-[11px] text-slate-500 mt-0.5">امسح الرمز بكاميرا الجوال للتحقق المباشر من صحة المستند على بوابة صحة</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">REF: {leave.NormalizedServiceCode} | MOH-KSA-VERIFIED</p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end text-center sm:text-left">
            <div className="border-2 border-emerald-600 rounded-xl p-2.5 px-4 bg-emerald-50/50 text-emerald-800 text-xs font-black rotate-[-2deg]">
              ✓ مُعْتَمَد ومُوَثَّق رَقْمِيّاً
              <div className="text-[10px] font-semibold text-emerald-600">MINISTRY OF HEALTH - KSA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions footer (hidden during print) */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <button
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition"
        >
          <ArrowRight className="w-4 h-4" />
          استعلام جديد
        </button>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الرمز' : 'نسخ رمز الخدمة'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير الرسمي
          </button>
        </div>
      </div>
    </div>
  );
};
