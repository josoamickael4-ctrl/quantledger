import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar, type AdminPage } from '../components/AdminSidebar';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { MembersPage } from '../pages/MembersPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

interface AdminLayoutProps {
  currentMember: { id: string; fullName: string; role: string };
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onLogout: () => void;
  backendOnline: boolean;
}

export function AdminLayout({ currentMember, apiFetch, onLogout, backendOnline }: AdminLayoutProps) {
  const [activePage, setActivePage] = useState<AdminPage>('admin-dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(v => !v);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-root">
      {/* Mobile menu toggle - outside main-area for better visibility */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        style={{
          display: 'flex',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 9999,
          background: 'rgba(10, 12, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '2px solid #d4a037',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '0.75rem',
          cursor: 'pointer',
          minWidth: '48px',
          minHeight: '48px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Menu size={28} color="#ffffff" />
      </button>

      {/* Mobile overlay */}
      <div 
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      <AdminSidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          closeMobileMenu();
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        currentMember={currentMember}
        onLogout={onLogout}
        backendOnline={backendOnline}
        mobileOpen={mobileMenuOpen}
      />

      <div className={`main-area ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <main className="page-content">
          {activePage === 'admin-dashboard' && (
            <AdminDashboardPage apiFetch={apiFetch} />
          )}
          {/* Removed AdminGlobalStatsPage and AdminConseilsPage per request */}
          {activePage === 'members' && (
            <MembersPage currentMember={currentMember} apiFetch={apiFetch} />
          )}
          {activePage === 'admin-settings' && (
            <AdminSettingsPage apiFetch={apiFetch} currentMember={currentMember} />
          )}
        </main>
      </div>
    </div>
  );
}
