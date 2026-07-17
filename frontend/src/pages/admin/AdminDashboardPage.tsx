import React, { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, Tooltip, Filler, type ChartConfiguration
} from 'chart.js';
import {
  Users, UserCheck, UserX, Zap, Calendar, Activity, RefreshCw
} from 'lucide-react';

Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, Tooltip, Filler
);

const GOLD = '#ffd700';
const GOLD_FADED = 'rgba(255,215,0,0.12)';
const GREEN = '#00e676';
const RED = '#ff1744';
const GRID = 'rgba(255,215,0,0.05)';
const TICK = '#6b7280';
const PURPLE = '#a78bfa';
const CYAN = '#38bdf8';

interface AdminStats {
  weeklyActivity?: { day: string; count: number }[];
  topMembers?: { memberId: string; fullName: string; pnl: number }[];
  retentionRate30d?: number;
  members: { total: number; active: number; disabled: number; newThisMonth: number; connectionsToday: number };
  trades: { total: number; totalProfit: number; totalLoss: number; winRate: number };
  charts: {
    monthlyRegistrations: { month: string; count: number }[];
    monthlyPnL: { month: string; profit: number; loss: number }[];
  };
  recentActivity: { memberId: string; fullName: string; lastLoginAt: string; tradesCount: number }[];
}

interface AdminDashboardPageProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: 'var(--card-bg)', borderRadius: '16px', border: `1px solid ${color}25`,
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px ${color}25`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle, ${color}15, transparent)`, borderRadius: '50%', transform: 'translate(25px,-25px)' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <div style={{ color, background: `${color}18`, borderRadius: '8px', padding: '0.35rem', display: 'flex' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

function useChart(ref: React.RefObject<HTMLCanvasElement | null>, config: ChartConfiguration | null) {
  const chartRef = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current || !config) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, config);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [config]);
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ apiFetch }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const registrationsRef = useRef<HTMLCanvasElement>(null);
  const pnlRef = useRef<HTMLCanvasElement>(null);
  const weeklyRef = useRef<HTMLCanvasElement>(null);
  const topMembersRef = useRef<HTMLCanvasElement>(null);

  const fetchStats = () => {
    setLoading(true);
    apiFetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setStats(data); setLoading(false); setLastRefresh(new Date()); })
      .catch(() => { setError('Impossible de charger les statistiques.'); setLoading(false); });
  };

  useEffect(() => { fetchStats(); }, []);

  const registrationsConfig: ChartConfiguration<'line'> | null = stats ? {
    type: 'line',
    data: {
      labels: stats.charts.monthlyRegistrations.map(d => d.month),
      datasets: [{
        label: 'Inscriptions',
        data: stats.charts.monthlyRegistrations.map(d => d.count),
        borderColor: GOLD, backgroundColor: GOLD_FADED,
        borderWidth: 2.5, pointBackgroundColor: GOLD, pointRadius: 5, fill: true, tension: 0.4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#ccc', borderColor: GOLD_FADED, borderWidth: 1 } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK, stepSize: 1, maxTicksLimit: 10 }, beginAtZero: true },
      },
    },
  } : null;

  const pnlConfig: ChartConfiguration<'bar'> | null = stats ? {
    type: 'bar',
    data: {
      labels: stats.charts.monthlyPnL.map(d => d.month),
      datasets: [
        { label: 'Profits ($)', data: stats.charts.monthlyPnL.map(d => d.profit), backgroundColor: `${GREEN}99`, borderColor: GREEN, borderWidth: 1.5, borderRadius: 6 },
        { label: 'Pertes ($)', data: stats.charts.monthlyPnL.map(d => d.loss), backgroundColor: `${RED}99`, borderColor: RED, borderWidth: 1.5, borderRadius: 6 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: TICK, font: { size: 11 }, boxWidth: 12, padding: 8 } },
        tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#ccc', borderColor: GOLD_FADED, borderWidth: 1 },
      },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK, callback: v => `${v}$`, maxTicksLimit: 10 } },
      },
    },
  } : null;

  const weeklyConfig: ChartConfiguration<'bar'> | null = stats?.weeklyActivity ? {
    type: 'bar',
    data: {
      labels: stats.weeklyActivity.map(d => d.day),
      datasets: [{
        label: 'Trades',
        data: stats.weeklyActivity.map(d => d.count),
        backgroundColor: `${CYAN}aa`, borderColor: CYAN, borderWidth: 1.5, borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#ccc', borderColor: GOLD_FADED, borderWidth: 1 } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK, stepSize: 1, maxTicksLimit: 10 }, beginAtZero: true },
      },
    },
  } : null;

  const topMembersConfig: ChartConfiguration<'bar'> | null = stats?.topMembers && stats.topMembers.length > 0 ? {
    type: 'bar',
    data: {
      labels: stats.topMembers.map(m => m.fullName.split(' ')[0]),
      datasets: [{
        label: 'PnL du mois',
        data: stats.topMembers.map(m => m.pnl),
        backgroundColor: stats.topMembers.map(m => m.pnl >= 0 ? GREEN : RED),
        borderColor: stats.topMembers.map(m => m.pnl >= 0 ? GREEN : RED),
        borderWidth: 1.5, borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y' as const,
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#ccc', borderColor: GOLD_FADED, borderWidth: 1 } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK, callback: v => `${v}$` } },
        y: { grid: { color: GRID }, ticks: { color: TICK } },
      },
    },
  } : null;


  useChart(weeklyRef, weeklyConfig);
  useChart(topMembersRef, topMembersConfig); useChart(registrationsRef, registrationsConfig);
  useChart(pnlRef, pnlConfig);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: `3px solid rgba(255,215,0,0.15)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)' }}>Chargement des statistiques…</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '1.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
    </div>
  );

  if (!stats) return null;

  const sectionLabel = (emoji: string, text: string) => (
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
      {emoji} {text}
    </div>
  );

  const chartCard = (children: React.ReactNode) => (
    <div style={{ background: 'rgba(14,18,30,0.7)', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.1)', padding: '1.5rem' }}>
      {children}
    </div>
  );

  const chartTitle = (icon: React.ReactNode, text: string) => (
    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: GOLD }}>{icon}</span> {text}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Tableau de bord</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Vue globale de la plateforme</p>
        </div>
        <button
          onClick={fetchStats}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: '10px', padding: '0.6rem 1.1rem', color: GOLD,
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,215,0,0.08)')}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Section Membres */}
      {sectionLabel('👥', 'Membres')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginTop: '-1rem' }}>
        <StatCard label="Total Membres" value={stats.members.total} icon={<Users size={18} />} color={GOLD} />
        <StatCard label="Actifs" value={stats.members.active} icon={<UserCheck size={18} />} color={GREEN}
          sub={`${stats.members.total > 0 ? Math.round((stats.members.active / stats.members.total) * 100) : 0}% du total`} />
        <StatCard label="Désactivés" value={stats.members.disabled} icon={<UserX size={18} />} color={RED} />
        <StatCard label="Nouveaux ce mois" value={stats.members.newThisMonth} icon={<Calendar size={18} />} color="#a78bfa" />
        <StatCard label="Connexions aujourd'hui" value={stats.members.connectionsToday} icon={<Zap size={18} />} color="#38bdf8" />
        {stats.retentionRate30d !== undefined && (
          <StatCard label="Rétention 30j" value={`${stats.retentionRate30d}%`} icon={<Activity size={18} />} color={PURPLE}
            sub="Actifs derniers 30 jours" />
        )}
      </div>



      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {chartCard(
          <>
            {chartTitle(<Users size={16} />, 'Évolution des inscriptions (6 mois)')}
            <div style={{ height: 220 }}><canvas ref={registrationsRef} /></div>
          </>
        )}

      </div>



      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Dernière actualisation : {lastRefresh.toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
};
