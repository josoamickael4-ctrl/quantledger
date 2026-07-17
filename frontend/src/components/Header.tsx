import React, { useState } from 'react';
import { BookOpen, MessageSquare, BarChart2, Compass, PlusCircle, FileText, Pencil, Check, X, Award, Calculator, Wallet, Shield } from 'lucide-react';
import type { Page } from './Sidebar';

interface HeaderProps {
  activePage: Page;
  onAddTrade: () => void;
  dailyGoal: number;
  todayPnL: number;
  onSetDailyGoal: (goal: number) => void;
  currentMember?: { id: string; fullName: string; role: string; profilePhoto?: string };
}

const PAGE_META: Record<Page, { title: string; icon: React.ReactNode }> = {
  journal: { title: 'Journal de Trading', icon: <BookOpen size={20} /> },
  tradesList: { title: 'Historique Complet des Trades', icon: <FileText size={20} /> },
  strategy: { title: 'Mes Stratégies & Setups', icon: <Compass size={20} /> },
  calculator: { title: 'Calculatrice de Lot XAU/USD', icon: <Calculator size={20} /> },
  capital: { title: 'Gestion de mon Capital', icon: <Wallet size={20} /> },
  conseils: { title: 'Ajouter un Conseil', icon: <Pencil size={20} /> },
  conseilsList: { title: 'Annuaire Conseils', icon: <MessageSquare size={20} /> },
  stats: { title: 'Statistiques & Performance', icon: <BarChart2 size={20} /> },
  admin: { title: 'Administration & Comptes', icon: <Shield size={20} /> },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onAddTrade,
  dailyGoal,
  todayPnL,
  onSetDailyGoal,
  currentMember,
}) => {
  const meta = PAGE_META[activePage] || { title: 'Mentor Or', icon: <BookOpen size={20} /> };

  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Daily Goal edit state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());

  const handleSaveGoal = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      onSetDailyGoal(val);
      setIsEditingGoal(false);
    } else {
      alert('Veuillez entrer un objectif valide.');
    }
  };

  // Calculate goal progress
  const progressPercent = dailyGoal > 0 ? Math.min(Math.round((todayPnL / dailyGoal) * 100), 100) : 0;
  const isGoalAchieved = todayPnL >= dailyGoal && dailyGoal > 0;

  return (
    <header className="header-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      background: 'rgba(8, 9, 13, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '1rem'
    }}>
      {/* Title - Mobile optimized */}
      <div className="header-page-title" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        flex: 1,
        minWidth: 0
      }}>
        <span style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>{meta.icon}</span>
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{meta.title}</span>
      </div>

      {/* Center/Middle: Daily Goal widgets - Mobile optimized */}
      <div className="header-goal-section" style={{
        display: 'none',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(8, 9, 13, 0.4)',
        padding: '0.3rem 0.75rem',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem'
      }}>
        {/* Progress label & value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Objectif :</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: todayPnL >= 0 ? 'var(--color-gain)' : 'var(--color-perte)',
            fontSize: '0.75rem'
          }}>
            {todayPnL >= 0 ? '+' : ''}{todayPnL.toFixed(0)} $
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>/</span>

          {/* Goal Value & Edit State */}
          {isEditingGoal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                style={{
                  width: '50px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--gold-secondary)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '0.1rem 0.2rem',
                  fontSize: '0.7rem',
                  textAlign: 'center'
                }}
              />
              <button onClick={handleSaveGoal} style={{ background: 'transparent', border: 'none', color: 'var(--color-gain)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <Check size={12} />
              </button>
              <button onClick={() => setIsEditingGoal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-perte)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <strong style={{ color: 'var(--gold-primary)', fontSize: '0.75rem' }}>{dailyGoal.toFixed(0)} $</strong>
              <button 
                onClick={() => { setGoalInput(dailyGoal.toString()); setIsEditingGoal(true); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                title="Modifier l'objectif"
              >
                <Pencil size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar Gauge */}
        <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ 
            width: `${Math.max(0, progressPercent)}%`, 
            height: '100%', 
            background: isGoalAchieved ? 'var(--color-gain)' : 'var(--gold-gradient)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Victory sparkles */}
        {isGoalAchieved && (
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.15rem', 
            fontSize: '0.65rem', 
            color: 'var(--color-gain)', 
            fontWeight: 'bold',
            background: 'rgba(0, 230, 118, 0.1)',
            padding: '0.1rem 0.3rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 230, 118, 0.2)',
            animation: 'pulse 2s infinite'
          }}>
            <Award size={8} />
            Atteint
          </span>
        )}
      </div>

      {/* Right Action buttons and Profile - Mobile optimized */}
      <div className="header-right" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Quick Add Trade - Mobile optimized */}
        {activePage === 'journal' && (
          <button 
            className="header-add-btn" 
            onClick={onAddTrade}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'var(--gold-gradient)',
              border: 'none',
              borderRadius: '20px',
              padding: '0.4rem 0.75rem',
              color: '#06070a',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-gold)',
              transition: 'transform 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <PlusCircle size={14} />
            <span style={{ display: 'none' }}>Nouveau Trade</span>
          </button>
        )}

        {/* Profile menu wrapper - Mobile optimized */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,215,0,0.04)',
              border: '1px solid rgba(255,215,0,0.12)',
              padding: '0.3rem 0.6rem',
              borderRadius: '20px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.12)'}
          >
            {/* Avatar Circle */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentMember?.profilePhoto 
                ? `url(${currentMember.profilePhoto}) center/cover` 
                : 'var(--gold-gradient)',
              color: 'black',
              fontWeight: 800,
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {!currentMember?.profilePhoto && currentMember?.fullName 
                ? currentMember.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : ''}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'none' }}>{currentMember?.fullName || 'Client'}</span>
          </button>

          {/* Profile Dropdown Menu - Mobile optimized */}
          {showProfileMenu && (
            <>
              <div 
                onClick={() => setShowProfileMenu(false)} 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
              />
              <div style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '220px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '12px',
                padding: '0.85rem',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{currentMember?.fullName || 'Client'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{currentMember?.role === 'admin' ? 'Administrateur' : 'Membre Elite Trader'}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Actif :</span>
                    <strong style={{ color: 'var(--gold-primary)' }}>XAU/USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Compte :</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Live Prop Firm</strong>
                  </div>
                </div>

                <button 
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.35rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Fermer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop styles */}
      <style>{`
        @media (min-width: 769px) {
          .header-goal-section {
            display: flex !important;
          }
          .header-add-btn span {
            display: inline !important;
          }
          .header-right span {
            display: inline !important;
          }
        }
      `}</style>
    </header>
  );
};
