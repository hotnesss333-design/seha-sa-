import React from 'react';
import { ActiveView, SEHA_EXTERNAL_URLS } from '../types';
import { navigateToExternal } from '../utils/navigation';
import { Phone, Mail, ShieldCheck, ExternalLink } from 'lucide-react';

interface FooterProps {
  setActiveView: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveView }) => {
  return (
    <footer className="bg-[#0f2137] text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Platform Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="منصة صحة"
                className="h-10 w-auto bg-white/10 rounded-md p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h3 className="text-xl font-black text-white">منصة صِحَّة</h3>
                <p className="text-xs text-blue-400">المنظومة الرقمية لوزارة الصحة</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              منصة إلكترونية وطنية تخدم القطاع الصحي في المملكة العربية السعودية من خلال تقديم خدمات إلكترونية معتمدة للمواطنين والمقيمين والمنشآت الصحية.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>تقارير معتمدة رسمياً وموثقة رقمياً من وزارة الصحة</span>
            </div>
          </div>

          {/* Col 2: Services & Inquiries */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              خدمات الاستعلام
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => setActiveView('inquiry')}
                  className="text-blue-400 hover:text-white transition hover:underline text-right font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>استعلام الإجازات المرضية ومرافق المريض</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded-sm">الحالي</span>
                </button>
              </li>
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.inquiries}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.inquiries, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>كافة الاستعلامات الصحية الأخرى</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.services}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.services, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>دليل الخدمات الإلكترونية</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.environmentalImpact}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.environmentalImpact, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 text-emerald-400 cursor-pointer"
                >
                  <span>الأثر البيئي والتحول الرقمي</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Links */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              بوابات المنصة
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.sehaPlus}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.sehaPlus, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>صحة بلس للشركات والمنشآت</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.faq}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.faq, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>الأسئلة الشائعة وإرشادات الاستخدام</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={SEHA_EXTERNAL_URLS.signup}
                  target="_top"
                  onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.signup, e)}
                  className="hover:text-white transition hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>إنشاء حساب مستفيد جديد</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('login')}
                  className="hover:text-white transition hover:underline text-right cursor-pointer"
                >
                  <span>بوابة تسجيل الدخول والإدارة</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us & Call Center */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              مركز الاتصال والدعم
            </h4>
            <div className="space-y-3 text-sm">
              <a
                href="tel:937"
                className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">مركز اتصال وزارة الصحة</div>
                  <div className="text-base font-bold text-white tracking-wider font-mono">937 (24 ساعة)</div>
                </div>
              </a>

              {/* تواصل معنا -> يحول لموقع تواصل معنا الخارجي كما طلب المستخدم */}
              <a
                href={SEHA_EXTERNAL_URLS.contactUs}
                target="_top"
                onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.contactUs, e)}
                className="flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 transition text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">الدعم الفني الإلكتروني</div>
                    <div className="text-sm font-bold text-white">تواصل معنا</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <img
                src="/assets/lean-logo-DYxfF_cZ.svg"
                alt="Lean"
                className="h-7 w-auto opacity-70 hover:opacity-100 transition"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <span className="text-xs text-slate-500">مشغّل بواسطة شركة لين لخدمات الأعمال</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright and legal links */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} وزارة الصحة - المملكة العربية السعودية. جميع الحقوق محفوظة لمنصة صحة.</p>
          <div className="flex items-center gap-4">
            <a
              href={SEHA_EXTERNAL_URLS.privacy}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.privacy, e)}
              className="hover:text-slate-300 cursor-pointer"
            >
              سياسة الخصوصية
            </a>
            <span>•</span>
            <a
              href={SEHA_EXTERNAL_URLS.terms}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.terms, e)}
              className="hover:text-slate-300 cursor-pointer"
            >
              شروط الاستخدام
            </a>
            <span>•</span>
            <a
              href={SEHA_EXTERNAL_URLS.contactUs}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.contactUs, e)}
              className="hover:text-slate-300 cursor-pointer"
            >
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
