(function () {
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  let csrfToken = null;
  const state = { user: null };
  async function bootstrap() {
    const response = await nativeFetch('/api/security/session', { credentials: 'same-origin', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'تعذر تهيئة الجلسة الآمنة');
    csrfToken = data.csrfToken; state.user = data.user;
    return data;
  }
  state.ready = bootstrap().catch(() => { state.user = null; });
  window.fetch = async function (resource, init = {}) {
    const request = new Request(resource, init);
    const url = new URL(request.url);
    if (url.origin !== location.origin) throw new Error('الاتصال بمواقع خارجية غير متاح');
    if (!url.pathname.startsWith('/api/')) return nativeFetch(request);
    await state.ready;
    const headers = new Headers(request.headers);
    if (!['GET','HEAD'].includes(request.method)) {
      if (!csrfToken) await bootstrap();
      headers.set('X-CSRF-Token', csrfToken);
    }
    const response = await nativeFetch(new Request(request, { headers, credentials: 'same-origin', cache: 'no-store' }));
    if (response.status === 401) state.user = null;
    return response;
  };
  state.login = async function (email, password) {
    const response = await fetch('/api/users/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({Username: email, Password: password}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errorMessage || 'تعذر تسجيل الدخول');
    csrfToken = data.csrfToken; state.user = data.user;
    if (!['admin','doctor'].includes(state.user.role)) throw new Error('لا توجد صلاحية للوصول إلى الإدارة؛ تواصل مع المشرف');
    return data;
  };
  state.logout = async function () {
    const response = await fetch('/api/security/logout', { method: 'POST' });
    if (!response.ok) throw new Error('تعذر تسجيل الخروج');
    csrfToken = null; state.user = null; await bootstrap();
  };
  window.SehaSecurity = state;
  // Invitation/recovery tokens stay in memory and are removed from browser history.
  const callback = /(?:^#|&)(invite_token|recovery_token)=([^&]+)/.exec(location.hash);
  if (callback) {
    const kind = callback[1] === 'invite_token' ? 'accept-invite' : 'recover';
    const callbackToken = decodeURIComponent(callback[2]);
    history.replaceState(null, '', location.pathname);
    document.addEventListener('DOMContentLoaded', function () {
      const dialog = document.createElement('dialog');
      dialog.dir = 'rtl';
      dialog.innerHTML = '<form><h2>تعيين كلمة المرور</h2><p>استخدم كلمة مرور لا تقل عن 12 حرفاً.</p><input type="password" name="password" minlength="12" maxlength="128" autocomplete="new-password" required aria-label="كلمة المرور الجديدة"><button>حفظ</button><p role="status"></p></form>';
      document.body.append(dialog); dialog.showModal();
      dialog.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        try {
          const response = await fetch('/api/security/' + kind, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:callbackToken,password:dialog.querySelector('input').value})});
          const data = await response.json(); if (!response.ok) throw Error(data.message);
          csrfToken = data.csrfToken; state.user = data.user; dialog.remove(); location.hash = '#/Dashboard'; window.SehaAdmin?.fetchLeaves();
        } catch (error) { dialog.querySelector('[role="status"]').textContent = error.message; }
      };
    });
  }
})();
