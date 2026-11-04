import React, { useState, useEffect } from 'react';
import { SickLeave, ActiveView, SEHA_EXTERNAL_URLS } from '../types';
import { navigateToExternal } from '../utils/navigation';
import { findSickLeave } from '../services/storage';
import { InquiryCard } from '../components/InquiryCard';
import { 
  Search, ShieldCheck, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, HelpCircle, ArrowRight, ExternalLink, ChevronRight
} from 'lucide-react';

interface InquiryPageProps {
  initialCode?: string;
  initialId?: string;
  setActiveView: (view: ActiveView) => void;
}

export const InquiryPage: React.FC<InquiryPageProps> = ({
  initialCode = '',
  initialId = '',
  setActiveView
}) => {
  // Form fields
  const [serviceCode, setServiceCode] = useState(initialCode);
  const [patientId, setPatientId] = useState(initialId);

  // Result state
  const [result, setResult] = useState<SickLeave | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check URL query parameters on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

      const codeParam = urlParams.get('NormalizedServiceCode') || 
                        urlParams.get('code') || 
                        urlParams.get('LeaveId') || 
                        hashParams.get('NormalizedServiceCode') || 
                        hashParams.get('code');

      const idParam = urlParams.get('PatientId') || 
                      urlParams.get('id') || 
                      urlParams.get('IDNumber') || 
                      hashParams.get('PatientId') || 
                      hashParams.get('id');

      if (codeParam && idParam) {
        setServiceCode(codeParam);
        setPatientId(idParam);
        executeSearch(idParam, codeParam);
      } else if (initialCode && initialId) {
        setServiceCode(initialCode);
        setPatientId(initialId);
        executeSearch(initialId, initialCode);
      }
    } catch (e) {}
  }, [initialCode, initialId]);

  const executeSearch = (id: string, code: string) => {
    setIsLoading(true);
    setSearched(true);
    setErrorMessage('');
    setResult(null);

    setTimeout(() => {
      const match = findSickLeave(id, code);
      if (match) {
        setResult(match);
      } else {
        setErrorMessage('لم يتم العثور على أي تقرير مطابق للبيانات المدخلة. يرجى التأكد من صحة رقم الهوية ورمز الخدمة والمحاولة مجدداً.');
      }
      setIsLoading(false);
    }, 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCode.trim()) {
      setErrorMessage('يرجى إدخال رمز الخدمة');
      return;
    }
    if (!patientId.trim()) {
      setErrorMessage('يرجى إدخال رقم الهوية أو الإقامة');
      return;
    }
    executeSearch(patientId.trim(), serviceCode.trim());
  };

  const handleSelectSample = (sampleCode: string, sampleId: string) => {
    setServiceCode(sampleCode);
    setPatientId(sampleId);
    executeSearch(sampleId, sampleCode);
  };

  const handleReset = () => {
    setResult(null);
    setSearched(false);
    setErrorMessage('');
    setServiceCode('');
    setPatientId('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & "رجوع للاستعلامات" Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <a
            href={SEHA_EXTERNAL_URLS.home}
            target="_top"
            onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.home, e)}
            className="hover:text-blue-600 transition cursor-pointer"
          >
            الرئيسية
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
          <a
            href={SEHA_EXTERNAL_URLS.inquiries}
            target="_top"
            onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.inquiries, e)}
            className="hover:text-blue-600 transition cursor-pointer"
          >
            الاستعلامات
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
          <span className="font-bold text-slate-800">الاستعلام عن الإجازات المرضية ومرافق المريض</span>
        </div>

        {/* Back to Inquiries Button -> يوديك لموقع الاستعلامات الخارجي كما طلب المستخدم */}
        <a
          href={SEHA_EXTERNAL_URLS.inquiries}
          target="_top"
          onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.inquiries, e)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع للاستعلامات</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>

      {/* Title & Introduction */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>خدمة الاستعلام الرسمية المعتمدة - وزارة الصحة</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          الاستعلام عن الإجازات المرضية ومرافق المريض
        </h1>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          تتيح هذه الخدمة للمستفيدين وأصحاب العمل التحقق المباشر من صحة وسريان تقارير الإجازات المرضية ومرافقي المرضى الصادرة من المستشفيات والمراكز المعتمدة.
        </p>
      </div>

      {/* If result is found, display InquiryCard */}
      {result ? (
        <InquiryCard leave={result} onReset={handleReset} />
      ) : (
        /* Inquiry Form Container */
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span>بيانات الاستعلام عن الإجازة المرضية أو المرافق</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              الرجاء إدخال البيانات كما هي مدونة في إشعار المراجعة أو الرسالة النصية الواردة من وزارة الصحة
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-5">
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5">
                رمز الخدمة (Service Code)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                  placeholder="مثال: GSL456789 أو CMP789123 أو GSL95819190024"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                يبدأ الرمز بـ GSL للإجازات المرضية أو بـ CMP لتقارير المرافقين
              </p>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 block mb-1.5">
                رقم الهوية الوطنية أو الإقامة (للمريض)
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="أدخل رقم الهوية أو الإقامة (10 أرقام)"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">تنبيه:</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري الاستعلام والتحقق من السجلات...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>استعلام عن التقرير</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Click Sample Inquiries for immediate verification */}
          <div className="pt-6 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2.5">
              نماذج جاهزة للاختبار الفوري السريع:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectSample('GSL456789', '1098765432')}
                className="p-3 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-right transition cursor-pointer"
              >
                <span className="block text-xs font-black text-blue-900">إجازة مرضية معتمدة</span>
                <span className="block text-[11px] text-blue-700 font-mono mt-0.5">رمز: GSL456789 | هوية: 1098765432</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample('CMP789123', '1029384756')}
                className="p-3 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-right transition cursor-pointer"
              >
                <span className="block text-xs font-black text-emerald-900">تقرير مرافق مريض (أخت)</span>
                <span className="block text-[11px] text-emerald-700 font-mono mt-0.5">رمز: CMP789123 | هوية: 1029384756</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample('GSL95819190024', '1126737343')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-right transition sm:col-span-2 cursor-pointer"
              >
                <span className="block text-xs font-black text-slate-900">تقرير إجازة - مجمع جراش الطبي</span>
                <span className="block text-[11px] text-slate-600 font-mono mt-0.5">رمز: GSL95819190024 | هوية: 1126737343</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQs / Guidelines on Inquiries */}
      <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          إرشادات الاستعلام والتحقق من التقارير
        </h3>
        <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
          <li>رمز الخدمة (Service Code) يُرسل عبر رسالة نصية (SMS) إلى هاتف المستفيد المسجل في أبشر فور اعتماد التقرير من الطبيب المعالج.</li>
          <li>يمكن لصاحب العمل أو الجهة الرسمية التحقق من صحة التقرير عبر هذه الصفحة ومقارنة البيانات الواردة مع التقرير الورقي.</li>
          <li>في حال تعذر العثور على التقرير، يرجى التواصل مع المنشأة الصحية المصدرة للتقرير أو الاتصال بمركز خدمة 937.</li>
        </ul>
      </div>
    </div>
  );
};
