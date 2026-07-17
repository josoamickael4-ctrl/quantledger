import React from 'react';
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, Coins, LogOut, Shield } from 'lucide-react';

export type AdminPage = 'admin-dashboard' | 'members' | 'admin-settings';

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentMember: { id: string; fullName: string; role: string } | null;
  onLogout: () => void;
  backendOnline: boolean;
  mobileOpen?: boolean;
}

const NAV_ITEMS: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id: 'admin-dashboard', label: 'Tableau de bord',        icon: <LayoutDashboard size={20} /> },
  { id: 'members',            label: 'Membres',               icon: <Users size={20} /> },
  { id: 'admin-settings',     label: 'Paramètres',            icon: <Settings size={20} /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activePage, onNavigate, collapsed, onToggleCollapse, currentMember, onLogout, backendOnline, mobileOpen = false,
}) => (
  <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)' }}>
    {/* Brand */}
    <div className="sidebar-brand">
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <Coins size={28} className="sidebar-brand-icon" />
        <Shield size={13} style={{ position: 'absolute', bottom: -2, right: -4, color: '#ffd700', background: '#0a0a14', borderRadius: '50%', padding: 1 }} />
      </div>
      <div className="sidebar-brand-text">
        <div className="sidebar-brand-title">Mentor Or</div>
        <div className="sidebar-brand-sub" style={{ color: '#ffd700', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Administration</div>
      </div>
    </div>

    {/* Section label */}
    {!collapsed && (
      <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Panneau Admin
      </div>
    )}

    {/* Navigation */}
    <nav className="sidebar-nav">
      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          title={collapsed ? item.label : undefined}
          style={activePage === item.id ? { background: 'rgba(255,215,0,0.12)', borderLeft: '3px solid #ffd700' } : {}}
        >
          <span style={{ color: activePage === item.id ? '#ffd700' : 'inherit' }}>{item.icon}</span>
          <span className="sidebar-nav-label" style={{ color: activePage === item.id ? '#ffd700' : 'inherit', fontWeight: activePage === item.id ? 700 : 500 }}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>

    {/* Footer */}
    <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
      {currentMember && (
        <div style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          background: 'rgba(255,215,0,0.05)', padding: '0.5rem',
          borderRadius: '8px', border: '1px solid rgba(255,215,0,0.15)'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100px', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffd700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {currentMember.fullName}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Administrateur
              </span>
            </div>
          )}
          <button
            onClick={onLogout}
            title="Se déconnecter"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      <div className="sidebar-status" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <span className={`indicator-dot ${backendOnline ? '' : 'offline'}`} style={{ flexShrink: 0 }} />
        {!collapsed && <span>{backendOnline ? 'Serveur connecté' : 'Mode local'}</span>}
      </div>

      <button className="sidebar-collapse-btn" onClick={onToggleCollapse} style={{ width: '100%', justifyContent: 'center' }}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        <span className="sidebar-collapse-btn-text">{collapsed ? '' : 'Réduire'}</span>
      </button>
    </div>
  </aside>
);
