import React, { useState } from 'react';
import { ActiveView, User, SEHA_EXTERNAL_URLS } from '../types';
import { navigateToExternal } from '../utils/navigation';
import { 
  Menu, X, User as UserIcon, LogOut, LayoutDashboard, 
  Search, ShieldCheck, ChevronDown, Globe, ExternalLink,
  UserPlus
} from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [inquiriesDropdownOpen, setInquiriesDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Ministry Bar */}
      <div className="bg-[#1b437c] text-white text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              المنصة الإلكترونية المعتمدة لخدمات وزارة الصحة بالمملكة العربية السعودية
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-200">
            <a href="tel:937" className="hover:text-white transition cursor-pointer">
              رقم الدعم الموحد: 937
            </a>
            <span>|</span>
            <span className="flex items-center gap-1 hover:text-white transition cursor-pointer">
              <Globe className="w-3 h-3" />
              العربية (SAR)
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & MOH Emblem */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveView('inquiry')}
              className="flex items-center gap-3 focus:outline-hidden text-right group cursor-pointer"
              title="الصفحة الرئيسية للاستعلام"
            >
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo.png"
                  alt="منصة صحة"
                  className="h-11 w-auto object-contain transition group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-[#1e3a8a] leading-none">صِحَّة</span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-1">منصة الخدمات الصحية</span>
                </div>
              </div>
            </button>

            <div className="hidden lg:block h-8 w-px bg-slate-200"></div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <img
                src="/assets/MOH-BoJJx336.svg"
                alt="وزارة الصحة"
                className="h-9 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* 1. الرئيسية -> يحول لموقع صحة الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.home}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.home, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              الرئيسية
            </a>

            {/* 2. الخدمات -> يحول لموقع الخدمات الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.services}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.services, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              الخدمات
            </a>

            {/* 3. صحة بلس -> يحول لموقع صحة بلس الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.sehaPlus}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.sehaPlus, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              صحة بلس
            </a>

            {/* 4. الاستعلامات Dropdown */}
            <div className="relative">
              <button
                onClick={() => setInquiriesDropdownOpen(!inquiriesDropdownOpen)}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeView === 'inquiry'
                    ? 'text-[#2563eb] bg-blue-50/80 font-extrabold'
                    : 'text-slate-700 hover:text-[#2563eb] hover:bg-slate-50'
                }`}
              >
                <span>الاستعلامات</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {inquiriesDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  {/* هذا يبقى بنفس الموقع */}
                  <button
                    onClick={() => {
                      setActiveView('inquiry');
                      setInquiriesDropdownOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 text-xs font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-100 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      الاستعلام عن الإجازات المرضية ومرافق المريض
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">هنا</span>
                  </button>

                  {/* باقي الاستعلامات تحول لموقع صحة الخارجي */}
                  <a
                    href={SEHA_EXTERNAL_URLS.inquiries}
                    target="_top"
                    onClick={(e) => {
                      setInquiriesDropdownOpen(false);
                      navigateToExternal(SEHA_EXTERNAL_URLS.inquiries, e);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>كافة الاستعلامات الصحية الأخرى (بوابة الاستعلامات)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              )}
            </div>

            {/* 5. الأسئلة الشائعة -> يحول لموقع الأسئلة الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.faq}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.faq, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              الأسئلة الشائعة
            </a>

            {/* 6. الأثر البيئي -> يحول لموقع الأثر البيئي الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.environmentalImpact}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.environmentalImpact, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              الأثر البيئي
            </a>

            {/* 7. تواصل معنا -> يحول لموقع تواصل معنا الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.contactUs}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.contactUs, e)}
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-slate-700 hover:text-[#2563eb] hover:bg-slate-50 transition cursor-pointer"
            >
              تواصل معنا
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* إنشاء حساب -> يحول لموقع التسجيل الخارجي */}
            <a
              href={SEHA_EXTERNAL_URLS.signup}
              target="_top"
              onClick={(e) => navigateToExternal(SEHA_EXTERNAL_URLS.signup, e)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>إنشاء حساب</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#1e3a8a] px-3.5 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">مرحباً بك</p>
                      <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                      <p className="text-xs text-blue-600 mt-0.5">رقم الهوية: {currentUser.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveView('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-right transition cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      لوحة تحكم التقارير
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('inquiry');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 text-right transition cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-slate-500" />
                      الاستعلام عن الإجازات
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-right transition cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveView('login')}
                className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-xs transition cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>

          {/* Mobile menu hamburger button (الثلاث شرطات بالأعلى) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setActiveView('inquiry')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
              title="استعلام الإجازات المرضية"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="القائمة الرئيسية (الثلاث شرطات)"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (عند الضغط على الثلاث شرطات) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1.5 shadow-xl">
          {/* 1. الرئيسية -> تحول لموقع صحة الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.home}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.home, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>الرئيسية</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 2. الخدمات -> تحول لموقع الخدمات الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.services}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.services, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>الخدمات</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 3. صحة بلس -> تحول لموقع صحة بلس الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.sehaPlus}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.sehaPlus, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>صحة بلس</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 4. الاستعلام عن الإجازات المرضية ومرافق المريض -> تبقى بالصفحة الحالية */}
          <button
            onClick={() => {
              setActiveView('inquiry');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-[#2563eb] bg-blue-50 border border-blue-200 transition cursor-pointer text-right"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              الاستعلام عن الإجازات المرضية ومرافق المريض
            </span>
            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">الواجهة الحالية</span>
          </button>

          {/* 5. باقي الاستعلامات / الرجوع للاستعلامات -> تحول لموقع الاستعلامات الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.inquiries}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.inquiries, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>باقي الاستعلامات الصحية (رجوع للاستعلامات)</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 6. الأسئلة الشائعة -> تحول لموقع الأسئلة الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.faq}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.faq, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>الأسئلة الشائعة</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 7. الأثر البيئي -> يحول لموقع الأثر البيئي الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.environmentalImpact}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.environmentalImpact, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>الأثر البيئي</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 8. تواصل معنا -> يحول لموقع تواصل معنا الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.contactUs}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.contactUs, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>تواصل معنا</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* 9. إنشاء حساب -> يحول لموقع التسجيل الخارجي */}
          <a
            href={SEHA_EXTERNAL_URLS.signup}
            target="_top"
            onClick={(e) => {
              setMobileMenuOpen(false);
              navigateToExternal(SEHA_EXTERNAL_URLS.signup, e);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              إنشاء حساب جديد
            </span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>

          <div className="pt-3 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-900 rounded-xl font-bold text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    لوحة تحكم التقارير
                  </span>
                  <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">{currentUser.name}</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveView('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white py-3 rounded-xl font-bold text-sm shadow-xs cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                تسجيل الدخول للمستفيدين والمسؤولين
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
