import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { MemberLayout } from './layouts/MemberLayout';

const API_STRATEGIES = '/api/strategies';

function App() {
  const [backendOnline, setBackendOnline] = useState(false);

  // Auth state
  const [currentMember, setCurrentMember] = useState<{ id: string; fullName: string; role: string } | null>(() => {
    const saved = localStorage.getItem('xau_member');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (member: any, sessionToken: string) => {
    localStorage.setItem('xau_member', JSON.stringify(member));
    localStorage.setItem('xau_session_token', sessionToken);
    setCurrentMember(member);
  };

  const handleLogout = () => {
    localStorage.removeItem('xau_member');
    localStorage.removeItem('xau_session_token');
    setCurrentMember(null);
  };

  // Helper for member-isolated API requests
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      'x-member-id': currentMember?.id || '',
      'x-member-role': currentMember?.role || '',
    };
    return fetch(url, { ...options, headers });
  };

  // Check backend connection
  useEffect(() => {
    const checkConn = async () => {
      try {
        const ping = await apiFetch(API_STRATEGIES);
        if (ping.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    
    checkConn();
    const interval = setInterval(checkConn, 10000);
    return () => clearInterval(interval);
  }, [currentMember]);

  if (!currentMember) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentMember.role === 'admin') {
    return (
      <AdminLayout
        currentMember={currentMember}
        apiFetch={apiFetch}
        onLogout={handleLogout}
        backendOnline={backendOnline}
      />
    );
  }

  return (
    <MemberLayout
      currentMember={currentMember}
      apiFetch={apiFetch}
      onLogout={handleLogout}
      onUpdateMember={setCurrentMember}
    />
  );
}

export default App;
