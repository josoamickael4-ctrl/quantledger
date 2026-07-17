import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, Award, BookOpen, Calendar } from 'lucide-react';

interface Trade {
  id?: string;
  resultat: number;
  actif: string;
  position: 'Achat' | 'Vente';
  createdAt?: string;
  strategyName?: string;
  emotion?: string;
}

interface MemberDashboardPageProps {
  trades: Trade[];
  capital: number;
  currentMember: { id: string; fullName: string; role: string };
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }> = ({ label, value, icon, color, sub, trend }) => (
  <div style={{
    background: 'var(--card-bg)', borderRadius: '16px', border: `1px solid ${color}30`,
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${color}25`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle, ${color}15, transparent)`, borderRadius: '50%', transform: 'translate(30px, -30px)' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ color, background: `${color}18`, borderRadius: '8px', padding: '0.35rem', display: 'flex' }}>{icon}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {trend && (
        <div style={{ marginBottom: '0.2rem', color: trend === 'up' ? '#00e676' : trend === 'down' ? '#ff1744' : 'var(--text-muted)', fontSize: '0.75rem' }}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
        </div>
      )}
    </div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

export const MemberDashboardPage: React.FC<MemberDashboardPageProps> = ({ trades, capital, currentMember }) => {
  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter(t => t.resultat > 0);
    const losses = trades.filter(t => t.resultat < 0);
    const totalProfit = wins.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
    const totalLoss = losses.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
    const netPnL = totalProfit + totalLoss;
    const winRate = total > 0 ? (wins.length / total) * 100 : 0;
    const avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(totalLoss) / losses.length : 0;

    const todayStr = new Date().toDateString();
    const todayTrades = trades.filter(t => t.createdAt && new Date(t.createdAt).toDateString() === todayStr);
    const todayPnL = todayTrades.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);

    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString();
    const monthTrades = trades.filter(t => t.createdAt && t.createdAt >= monthStart);
    const monthPnL = monthTrades.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);

    return { total, wins: wins.length, losses: losses.length, totalProfit, totalLoss, netPnL, winRate, avgWin, avgLoss, todayPnL, todayTrades: todayTrades.length, monthPnL, monthTrades: monthTrades.length };
  }, [trades]);

  const recentTrades = trades.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Greeting */}
      <div style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.02) 100%)', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {greeting}, <span style={{ color: '#ffd700' }}>{currentMember.fullName}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.88rem' }}>
            Voici un aperçu de vos performances
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Capital actuel</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffd700' }}>${capital.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Today & Month quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <StatCard label="P&L Aujourd'hui" value={`${typeof stats.todayPnL === 'number' && stats.todayPnL >= 0 ? '+' : ''}$${typeof stats.todayPnL === 'number' ? stats.todayPnL.toFixed(2) : '0.00'}`} icon={<Calendar size={18} />} color={typeof stats.todayPnL === 'number' && stats.todayPnL >= 0 ? '#00e676' : '#ff1744'} sub={`${stats.todayTrades} trade(s)`} trend={typeof stats.todayPnL === 'number' && stats.todayPnL > 0 ? 'up' : typeof stats.todayPnL === 'number' && stats.todayPnL < 0 ? 'down' : 'neutral'} />
        <StatCard label="P&L Ce mois" value={`${typeof stats.monthPnL === 'number' && stats.monthPnL >= 0 ? '+' : ''}$${typeof stats.monthPnL === 'number' ? stats.monthPnL.toFixed(2) : '0.00'}`} icon={<Activity size={18} />} color={typeof stats.monthPnL === 'number' && stats.monthPnL >= 0 ? '#00e676' : '#ff1744'} sub={`${stats.monthTrades} trade(s)`} trend={typeof stats.monthPnL === 'number' && stats.monthPnL > 0 ? 'up' : typeof stats.monthPnL === 'number' && stats.monthPnL < 0 ? 'down' : 'neutral'} />
        <StatCard label="Win Rate" value={`${typeof stats.winRate === 'number' ? stats.winRate.toFixed(1) : '0.0'}%`} icon={<Target size={18} />} color="#f59e0b" sub={`${stats.wins}W / ${stats.losses}L`} trend={typeof stats.winRate === 'number' && stats.winRate >= 50 ? 'up' : 'down'} />
        <StatCard label="Total Trades" value={stats.total} icon={<BookOpen size={18} />} color="#ffd700" />
      </div>

      {/* Main stats grid */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>📊 Performance globale</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <StatCard label="Net P&L" value={`${typeof stats.netPnL === 'number' && stats.netPnL >= 0 ? '+' : ''}$${typeof stats.netPnL === 'number' ? stats.netPnL.toFixed(2) : '0.00'}`} icon={<DollarSign size={18} />} color={typeof stats.netPnL === 'number' && stats.netPnL >= 0 ? '#00e676' : '#ff1744'} sub="Depuis le début" trend={typeof stats.netPnL === 'number' && stats.netPnL > 0 ? 'up' : 'down'} />
          <StatCard label="Total Profits" value={`+$${typeof stats.totalProfit === 'number' ? stats.totalProfit.toFixed(2) : '0.00'}`} icon={<TrendingUp size={18} />} color="#00e676" sub={`${stats.wins} trades gagnants`} />
          <StatCard label="Total Pertes" value={`-$${typeof stats.totalLoss === 'number' ? Math.abs(stats.totalLoss).toFixed(2) : '0.00'}`} icon={<TrendingDown size={18} />} color="#ff1744" sub={`${stats.losses} trades perdants`} />
          <StatCard label="Gain moyen" value={`$${typeof stats.avgWin === 'number' ? stats.avgWin.toFixed(2) : '0.00'}`} icon={<Award size={18} />} color="#a78bfa" sub="Par trade gagnant" />
        </div>
      </div>

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.1)', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} style={{ color: '#ffd700' }} /> Derniers trades
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentTrades.map((t, i) => (
              <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.resultat > 0 ? '#00e676' : '#ff1744', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.actif} · {t.position}</div>
                    {t.createdAt && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString('fr-FR')}</div>}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: t.resultat > 0 ? '#00e676' : '#ff1744', fontSize: '0.9rem' }}>
                  {t.resultat > 0 ? '+' : ''}{typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00'} $
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trades.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed rgba(255,215,0,0.2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📒</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Aucun trade enregistré</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Commencez par enregistrer votre premier trade dans le Journal de Trading.</div>
        </div>
      )}
    </div>
  );
};
