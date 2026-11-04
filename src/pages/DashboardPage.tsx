import React, { useState, useEffect } from 'react';
import { SickLeave, User, ActiveTab } from '../types';
import { 
  getStoredLeaves, saveSickLeave, deleteSickLeave, 
  getStoredUsers, saveUser, deleteUser 
} from '../services/storage';
import { LeaveModal } from '../components/LeaveModal';
import { 
  LayoutDashboard, FileText, UserCheck, Users, Plus, Search, 
  Edit3, Trash2, ExternalLink, ShieldCheck, CheckCircle2, 
  Clock, AlertTriangle, Building2, Stethoscope, RefreshCw, X, Eye
} from 'lucide-react';

interface DashboardPageProps {
  currentUser: User | null;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenInquiry: (code: string, id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  setActiveTab,
  onOpenInquiry
}) => {
  const [leaves, setLeaves] = useState<SickLeave[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTabLocal] = useState<'leaves' | 'companions' | 'users' | 'analytics'>('leaves');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<SickLeave | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<'leave' | 'companion'>('leave');

  // Delete modal state
  const [leaveToDelete, setLeaveToDelete] = useState<SickLeave | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [userError, setUserError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const refreshData = () => {
    setLeaves(getStoredLeaves());
    setUsers(getStoredUsers());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveLeave = (leaveData: SickLeave, isEdit: boolean) => {
    const updated = saveSickLeave(leaveData, isEdit);
    setLeaves(updated);
    setIsModalOpen(false);
    setEditingLeave(null);
    showToast(isEdit ? 'تم تحديث التقرير وحفظه بنجاح' : 'تمت إضافة التقرير وحفظه في قاعدة البيانات بنجاح');
  };

  const handleDeleteLeave = () => {
    if (!leaveToDelete) return;
    const updated = deleteSickLeave(leaveToDelete.id || leaveToDelete.NormalizedServiceCode);
    setLeaves(updated);
    setLeaveToDelete(null);
    showToast('تم حذف التقرير بنجاح');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    const updated = saveUser({
      username: newUsername.trim(),
      password: newPassword.trim(),
      name: newName.trim() || `مستخدم ${newUsername}`,
      role: 'admin'
    });
    setUsers(updated);
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setUserError('');
    showToast('تمت إضافة المستخدم بنجاح');
  };

  const handleDeleteUser = (username: string) => {
    if (users.length <= 1) {
      alert('لا يمكن حذف آخر مسؤول متبقي للنظام.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المستخدم ${username}؟`)) {
      const updated = deleteUser(username);
      setUsers(updated);
      showToast('تم حذف المستخدم بنجاح');
    }
  };

  // Metrics
  const sickLeavesOnly = leaves.filter(l => !l.isCompanion && l.type !== 'companion' && !l.CompanionName);
  const companionsOnly = leaves.filter(l => l.isCompanion || l.type === 'companion' || l.CompanionName || l['Patient Name']);

  const activeLeavesCount = leaves.filter(l => l.Status && (l.Status.includes('سارية') || l.Status.includes('نشطة') || l.Status.includes('معتمدة'))).length;
  const expiredLeavesCount = leaves.filter(l => l.Status && (l.Status.includes('منتهية') || l.Status.includes('ملغاة'))).length;

  // Filtered lists
  const currentList = activeTab === 'companions' ? companionsOnly : sickLeavesOnly;

  const filteredList = currentList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const code = String(item.NormalizedServiceCode || '').toLowerCase();
    const id = String(item.PatientId || '').toLowerCase();
    const name = String(item.PatientName || '').toLowerCase();
    const comp = String(item.CompanionName || item['Patient Name'] || '').toLowerCase();
    const hospital = String(item.Hospital || item.OrganizationName || '').toLowerCase();
    const doctor = String(item.DoctorName || item['Doctor NAME'] || '').toLowerCase();
    return code.includes(q) || id.includes(q) || name.includes(q) || comp.includes(q) || hospital.includes(q) || doctor.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">لوحة تحكم وإدارة التقارير الطبية</h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                قاعدة بيانات نشطة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              إدارة الإجازات المرضية المعتمدة، تقارير المرافقين، والتحقق الفوري من السجلات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingLeave(null);
              setModalDefaultType(activeTab === 'companions' ? 'companion' : 'leave');
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إصدار تقرير جديد</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي التقارير</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">{leaves.length}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">الإجازات المرضية</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">{sickLeavesOnly.length}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">تقارير مرافقي المرضى</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">{companionsOnly.length}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">التقارير السارية</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">{activeLeavesCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTabLocal('leaves')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'leaves'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الإجازات المرضية ({sickLeavesOnly.length})</span>
          </button>

          <button
            onClick={() => setActiveTabLocal('companions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'companions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>مرافقي المرضى ({companionsOnly.length})</span>
          </button>

          <button
            onClick={() => setActiveTabLocal('users')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمون والمسؤولون ({users.length})</span>
          </button>
        </div>

        {/* Search Input for Leaves / Companions */}
        {activeTab !== 'users' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الهوية، الرمز..."
              className="w-full pr-10 pl-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Tab 1 & Tab 2: Leaves or Companions Table */}
      {(activeTab === 'leaves' || activeTab === 'companions') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black">
                <tr>
                  <th className="p-4">رمز الخدمة</th>
                  <th className="p-4">اسم المريض</th>
                  {activeTab === 'companions' && (
                    <>
                      <th className="p-4">اسم المرافق</th>
                      <th className="p-4">صلة القرابة</th>
                    </>
                  )}
                  <th className="p-4">رقم الهوية</th>
                  <th className="p-4">المدة</th>
                  <th className="p-4">الفترة (من - إلى)</th>
                  <th className="p-4">المنشأة الطبية</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'companions' ? 10 : 8} className="p-8 text-center text-slate-400">
                      لم يتم العثور على أي تقارير مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id || item.NormalizedServiceCode} className="hover:bg-slate-50/70 transition">
                      {/* Code */}
                      <td className="p-4 font-mono font-bold text-blue-700">
                        {item.NormalizedServiceCode}
                      </td>

                      {/* Patient Name */}
                      <td className="p-4 font-bold text-slate-900">
                        {item.PatientName}
                      </td>

                      {/* Companion Specific Fields */}
                      {activeTab === 'companions' && (
                        <>
                          <td className="p-4 font-bold text-emerald-800">
                            {item.CompanionName || item['Patient Name'] || '—'}
                          </td>
                          <td className="p-4 font-semibold text-slate-600">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-bold">
                              {item.RelationshipName || item.Relationship || 'مرافق'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* ID */}
                      <td className="p-4 font-mono text-slate-600">
                        {item.PatientId}
                      </td>

                      {/* Duration */}
                      <td className="p-4 font-bold text-slate-800">
                        {item.Duration} يوم
                      </td>

                      {/* Dates */}
                      <td className="p-4 text-xs text-slate-600 font-mono">
                        <div>{item.From}</div>
                        <div className="text-slate-400">إلى {item.To}</div>
                      </td>

                      {/* Hospital */}
                      <td className="p-4 text-xs font-semibold text-slate-700">
                        {item.Hospital || item.OrganizationName}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.Status || 'نشطة / سارية'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View in Inquiry Page */}
                          <button
                            onClick={() => onOpenInquiry(item.NormalizedServiceCode, item.PatientId)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="عرض في صفحة الاستعلام وطباعة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingLeave(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="تعديل التقرير"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setLeaveToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف التقرير"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* User List Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>قائمة مسؤولي النظام المسجلين</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">اسم المستخدم / رقم الهوية</th>
                    <th className="p-3.5">الاسم الكامل</th>
                    <th className="p-3.5">الدور والصلاحيات</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.username} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{u.username}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{u.name}</td>
                      <td className="p-3.5">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200">
                          مسؤول نظام
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.username)}
                          disabled={users.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                          title="حذف المسؤول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Form (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>إضافة مسؤول جديد</span>
            </h3>

            {userError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                {userError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المستخدم / رقم الهوية</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: 77899900"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الاسم المعروض</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: د. سلطان العتيبي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-xs"
              >
                حفظ المستخدم الجديد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      <LeaveModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLeave(null);
        }}
        onSave={handleSaveLeave}
        initialLeave={editingLeave}
        defaultType={modalDefaultType}
      />

      {/* Delete Confirmation Modal */}
      {leaveToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">تأكيد حذف التقرير الطبي</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                هل أنت متأكد من رغبتك في حذف تقرير الخدمة رقم{' '}
                <span className="font-mono font-bold text-slate-800">{leaveToDelete.NormalizedServiceCode}</span>{' '}
                للمريض {leaveToDelete.PatientName}؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setLeaveToDelete(null)}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteLeave}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                تأكيد الحذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
