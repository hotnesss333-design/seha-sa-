import React, { useState, useEffect } from 'react';
import { ActiveView, User, SEHA_EXTERNAL_URLS } from './types';
import { getCurrentUser, setCurrentUser } from './services/storage';
import { openExternalUrl } from './utils/navigation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InquiryPage } from './pages/InquiryPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('inquiry');
  const [currentUser, setCurrentUserState] = useState<User | null>(getCurrentUser());
  const [inquiryCode, setInquiryCode] = useState('');
  const [inquiryId, setInquiryId] = useState('');

  // Handle Hash routing and external redirects if requested by hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();

      // Views kept within the applet
      if (hash.includes('/dashboard')) {
        setActiveView('dashboard');
        return;
      }
      if (hash.includes('/login') || hash.includes('/account/login')) {
        setActiveView('login');
        return;
      }

      // External redirects if user navigated via hash
      if (hash.includes('/seha-plus')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.sehaPlus);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }
      if (hash.includes('/services')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.services);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }
      if (hash.includes('/faq')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.faq);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }
      if (hash.includes('/environmental-impact')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.environmentalImpact);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }
      if (hash.includes('/contact')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.contactUs);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }
      if (hash.includes('/signup')) {
        openExternalUrl(SEHA_EXTERNAL_URLS.signup);
        window.location.hash = '#/inquiries/slenquiry';
        setActiveView('inquiry');
        return;
      }

      // Default: Sick Leave & Companion Inquiry
      setActiveView('inquiry');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (view) {
      case 'inquiry':
        window.location.hash = '#/inquiries/slenquiry';
        break;
      case 'dashboard':
        window.location.hash = '#/Dashboard';
        break;
      case 'login':
        window.location.hash = '#/account/login';
        break;
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    handleViewChange('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    handleViewChange('inquiry');
  };

  const handleOpenInquiry = (code: string, id: string) => {
    setInquiryCode(code);
    setInquiryId(id);
    handleViewChange('inquiry');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans" dir="rtl">
      <Header
        activeView={activeView}
        setActiveView={handleViewChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeView === 'inquiry' && (
          <InquiryPage
            initialCode={inquiryCode}
            initialId={inquiryId}
            setActiveView={handleViewChange}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardPage
            currentUser={currentUser}
            setActiveTab={handleViewChange}
            onOpenInquiry={handleOpenInquiry}
          />
        )}

        {activeView === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            setActiveTab={handleViewChange}
          />
        )}
      </main>

      <Footer setActiveView={handleViewChange} />
    </div>
  );
}

export default App;
