import React from 'react';
import { Coins, BookOpen, MessageSquare, BarChart2, Compass, Pencil, FileText, ChevronLeft, ChevronRight, Calculator, Wallet, LogOut, LayoutDashboard, User } from 'lucide-react';

export type MemberPage = 'member-dashboard' | 'journal' | 'tradesList' | 'strategy' | 'conseils' | 'conseilsList' | 'stats' | 'calculator' | 'capital' | 'member-profile';

interface MemberSidebarProps {
  activePage: MemberPage;
  onNavigate: (page: MemberPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  tradeCount: number;
  conseilCount: number;
  strategyCount: number;
  backendOnline: boolean;
  currentMember: { id: string; fullName: string; role: string } | null;
  onLogout: () => void;
  mobileOpen?: boolean;
}

const NAV_ITEMS: { id: MemberPage; label: string; icon: React.ReactNode; badgeKey: 'tradeCount' | 'conseilCount' | 'strategyCount' | null }[] = [
  { id: 'member-dashboard', label: 'Tableau de bord',    icon: <LayoutDashboard size={20} />, badgeKey: null },
  { id: 'journal',          label: 'Journal Trading',    icon: <BookOpen size={20} />,        badgeKey: 'tradeCount' },
  { id: 'tradesList',       label: 'Historique',         icon: <FileText size={20} />,        badgeKey: null },
  { id: 'stats',            label: 'Analyses',           icon: <BarChart2 size={20} />,       badgeKey: null },
  { id: 'strategy',         label: 'Stratégies',         icon: <Compass size={20} />,         badgeKey: 'strategyCount' },
  { id: 'capital',          label: 'Mon Capital',        icon: <Wallet size={20} />,          badgeKey: null },
  { id: 'calculator',       label: 'Calculatrice',       icon: <Calculator size={20} />,      badgeKey: null },
  { id: 'conseils',         label: 'Ajouter Conseil',    icon: <Pencil size={20} />,          badgeKey: null },
  { id: 'conseilsList',     label: 'Mes Conseils',       icon: <MessageSquare size={20} />,   badgeKey: 'conseilCount' },
  { id: 'member-profile',   label: 'Mon Profil',         icon: <User size={20} />,            badgeKey: null },
];

export const MemberSidebar: React.FC<MemberSidebarProps> = ({
  activePage, onNavigate, collapsed, onToggleCollapse,
  tradeCount, conseilCount, strategyCount, backendOnline, currentMember, onLogout, mobileOpen = false,
}) => {
  const getBadge = (key: 'tradeCount' | 'conseilCount' | 'strategyCount' | null) => {
    if (key === 'tradeCount') return tradeCount;
    if (key === 'conseilCount') return conseilCount;
    if (key === 'strategyCount') return strategyCount;
    return null;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <Coins size={28} className="sidebar-brand-icon" />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Mentor Or</div>
          <div className="sidebar-brand-sub">XAU/USD Trading</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const badge = getBadge(item.badgeKey);
          return (
            <div
              key={item.id}
              className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="sidebar-nav-label">{item.label}</span>
              {badge !== null && badge > 0 && (
                <span className="sidebar-badge">{badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
        {currentMember && (
          <div style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            background: 'rgba(255,255,255,0.02)', padding: '0.5rem',
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentMember.fullName}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Membre</span>
              </div>
            )}
            <button
              onClick={onLogout}
              title="Se déconnecter"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease' }}
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
};
