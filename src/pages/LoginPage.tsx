import React, { useState } from 'react';
import { User, ActiveTab } from '../types';
import { getStoredUsers, setCurrentUser } from '../services/storage';
import { 
  ShieldCheck, Lock, User as UserIcon, LogIn, 
  AlertCircle, KeyRound, Sparkles, Building2, Check
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, setActiveTab }) => {
  const [authMethod, setAuthMethod] = useState<'credentials' | 'iam'>('credentials');
  const [username, setUsername] = useState('77899900');
  const [password, setPassword] = useState('77889900');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // IAM Simulation state
  const [iamCode, setIamCode] = useState('42');
  const [iamWaiting, setIamWaiting] = useState(false);

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const users = getStoredUsers();
      const uStr = username.trim();
      const pStr = password.trim();

      const match = users.find(u => u.username === uStr && u.password === pStr) ||
        ((uStr === '77899900' || uStr === '77889900' || uStr === 'admin') && (pStr === '77889900' || pStr === '77899900')
          ? { username: uStr, name: 'مسؤول المنصة', role: 'admin' as const }
          : null);

      if (match) {
        setCurrentUser(match);
        onLoginSuccess(match);
      } else {
        setErrorMessage('بيانات الدخول غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleIamLogin = () => {
    setIamWaiting(true);
    setErrorMessage('');
    setTimeout(() => {
      const adminUser: User = {
        username: '77899900',
        name: 'مستفيد نفاذ الوطني',
        role: 'admin'
      };
      setCurrentUser(adminUser);
      onLoginSuccess(adminUser);
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <img
            src="/images/logo.png"
            alt="منصة صحة"
            className="h-14 w-auto mx-auto object-contain"
            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
          />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            تسجيل الدخول إلى منصة صِحَّة
          </h2>
          <p className="text-xs text-slate-500">
            بوابة الدخول الموحدة للمستفيدين، المنشآت الصحية، والممارسين
          </p>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setAuthMethod('credentials')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              authMethod === 'credentials'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>بيانات الحساب</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMethod('iam')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              authMethod === 'iam'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>النفاذ الوطني (IAM)</span>
          </button>
        </div>

        {/* Credentials Form */}
        {authMethod === 'credentials' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                اسم المستخدم / رقم الهوية
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل رقم الهوية أو اسم المستخدم"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                <a href="#/Account/Forget" onClick={(e) => { e.preventDefault(); alert('يرجى التواصل مع مسؤول النظام لإعادة ضبط كلمة المرور.'); }} className="text-[11px] text-blue-600 hover:underline font-semibold">
                  نسيت كلمة المرور؟
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-75"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'جاري التحقق...' : 'دخول إلى الحساب'}</span>
            </button>
          </form>
        )}

        {/* Nafath / IAM View */}
        {authMethod === 'iam' && (
          <div className="space-y-6 text-center">
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-mono font-black shadow-md">
                {iamCode}
              </div>
              <h4 className="text-sm font-bold text-emerald-950">
                تسجيل الدخول عبر تطبيق نَفَاذ (Nafath)
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                افتح تطبيق نفاذ في هاتفك المحمول وقم بتأكيد رقم الطلب أعلاه لإتمام الدخول الآمن الموحد.
              </p>
            </div>

            <button
              type="button"
              onClick={handleIamLogin}
              disabled={iamWaiting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{iamWaiting ? 'جاري التحقق من تطبيق نفاذ...' : 'تأكيد المصادقة والدخول'}</span>
            </button>
          </div>
        )}

        {/* Demo Credentials Helper */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
          <span className="font-bold text-slate-700 block">بيانات دخول تجريبية للمسؤول:</span>
          <div className="flex items-center justify-between text-slate-600 font-mono">
            <span>الهوية: 77899900</span>
            <span>كلمة المرور: 77889900</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUsername('77899900');
              setPassword('77889900');
            }}
            className="text-[11px] text-blue-600 hover:underline font-bold block"
          >
            تعبئة تلقائية للبيانات
          </button>
        </div>
      </div>
    </div>
  );
};
