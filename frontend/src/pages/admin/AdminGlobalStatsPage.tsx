import React, { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, DoughnutController, ArcElement,
  Tooltip, Legend, Filler, type ChartConfiguration
} from 'chart.js';
import {
  TrendingUp, TrendingDown, BarChart2, Target, Users,
  DollarSign, Award, Activity, Zap, RefreshCw
} from 'lucide-react';

Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, DoughnutController, ArcElement,
  Tooltip, Legend, Filler
);

const GOLD = '#ffd700';
const GOLD_FADED = 'rgba(255,215,0,0.12)';
const GREEN = '#00e676';
const RED = '#ff1744';
const GRID = 'rgba(255,215,0,0.05)';
const TICK = '#6b7280';

interface GlobalStats {
  weeklyActivity?: { day: string; count: number }[];
  topMembers?: { memberId: string; fullName: string; pnl: number }[];
  retentionRate30d?: number;
  members: {
    total: number; active: number; disabled: number;
    newThisMonth: number; connectionsToday: number;
  };
  trades: {
    total: number; totalProfit: number; totalLoss: number; winRate: number;
  };
  charts: {
    monthlyRegistrations: { month: string; count: number }[];
    monthlyPnL: { month: string; profit: number; loss: number }[];
  };
  recentActivity: {
    memberId: string; fullName: string; lastLoginAt: string; tradesCount: number;
  }[];
}

interface AdminGlobalStatsPageProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const KpiCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
}> = ({ label, value, icon, color, sub, trend }) => (
  <div style={{
    background: 'var(--card-bg, rgba(14,18,30,0.7))',
    borderRadius: '16px',
    border: `1px solid ${color}25`,
    padding: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px ${color}20`; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: `radial-gradient(circle, ${color}15, transparent)`, borderRadius: '50%', transform: 'translate(25px, -25px)' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <div style={{ color, background: `${color}18`, borderRadius: '8px', padding: '0.35rem', display: 'flex' }}>{icon}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {trend && (
        <div style={{ marginBottom: '0.25rem', fontSize: '0.8rem', color: trend === 'up' ? GREEN : trend === 'down' ? RED : '#64748b' }}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
        </div>
      )}
    </div>
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

export const AdminGlobalStatsPage: React.FC<AdminGlobalStatsPageProps> = ({ apiFetch }) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const pnlRef = useRef<HTMLCanvasElement>(null);
  const registrationsRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);

  const fetchStats = () => {
    setLoading(true);
    apiFetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setStats(data); setLoading(false); setLastRefresh(new Date()); })
      .catch(() => { setError('Impossible de charger les statistiques globales.'); setLoading(false); });
  };

  useEffect(() => { fetchStats(); }, []);

  const pnlConfig: ChartConfiguration<'bar'> | null = stats ? {
    type: 'bar',
    data: {
      labels: stats.charts.monthlyPnL.map(d => d.month),
      datasets: [
        {
          label: 'Profits ($)',
          data: stats.charts.monthlyPnL.map(d => d.profit),
          backgroundColor: `${GREEN}bb`, borderColor: GREEN, borderWidth: 1.5, borderRadius: 6,
        },
        {
          label: 'Pertes ($)',
          data: stats.charts.monthlyPnL.map(d => d.loss),
          backgroundColor: `${RED}bb`, borderColor: RED, borderWidth: 1.5, borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: TICK, font: { size: 11 }, boxWidth: 12, padding: 10 } },
        tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#f3f4f6', borderColor: GOLD_FADED, borderWidth: 1 },
      },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK, callback: v => `${v}$`, maxTicksLimit: 10 } },
      },
    },
  } : null;

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
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#f3f4f6', borderColor: GOLD_FADED, borderWidth: 1 },
      },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, ticks: { color: TICK, stepSize: 1, maxTicksLimit: 10 }, beginAtZero: true },
      },
    },
  } : null;

  const winLoss = stats
    ? { wins: Math.round((stats.trades.total * stats.trades.winRate) / 100), losses: stats.trades.total - Math.round((stats.trades.total * stats.trades.winRate) / 100) }
    : { wins: 0, losses: 0 };

  const donutConfig: ChartConfiguration<'doughnut'> | null = stats && stats.trades.total > 0 ? {
    type: 'doughnut',
    data: {
      labels: ['Trades gagnants', 'Trades perdants'],
      datasets: [{
        data: [winLoss.wins, winLoss.losses],
        backgroundColor: [`${GREEN}cc`, `${RED}cc`],
        borderColor: [GREEN, RED], borderWidth: 2, hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: TICK, font: { size: 12 }, padding: 16, boxWidth: 12 } },
        tooltip: { backgroundColor: '#0f111a', titleColor: GOLD, bodyColor: '#f3f4f6', borderColor: GOLD_FADED, borderWidth: 1 },
      },
    },
  } : null;

  useChart(pnlRef, pnlConfig);
  useChart(registrationsRef, registrationsConfig);
  useChart(donutRef, donutConfig);

  const netPnL = stats ? stats.trades.totalProfit - stats.trades.totalLoss : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, border: `3px solid rgba(255,215,0,0.15)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)' }}>Chargement des statistiques globales…</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '1.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
    </div>
  );

  if (!stats) return null;

  const sectionLabel = (emoji: string, text: string) => (
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
      {emoji} {text}
    </div>
  );

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{
      background: 'rgba(14,18,30,0.7)', borderRadius: '16px',
      border: '1px solid rgba(255,215,0,0.1)', padding: '1.5rem',
      ...extra,
    }}>
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Statistiques Globales
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Vue consolidée de toute l'activité de la plateforme
          </p>
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
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* Membres KPIs */}
      {sectionLabel('👥', 'Membres')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginTop: '-1rem' }}>
        <KpiCard label="Total membres" value={stats.members.total} icon={<Users size={18} />} color={GOLD} />
        <KpiCard label="Actifs" value={stats.members.active} icon={<Zap size={18} />} color={GREEN}
          sub={`${stats.members.total > 0 ? Math.round((stats.members.active / stats.members.total) * 100) : 0}% du total`}
          trend={stats.members.active > stats.members.disabled ? 'up' : 'down'} />
        <KpiCard label="Désactivés" value={stats.members.disabled} icon={<Users size={18} />} color={RED} />
        <KpiCard label="Nouveaux ce mois" value={stats.members.newThisMonth} icon={<Award size={18} />} color="#a78bfa" />
        <KpiCard label="Connexions aujourd'hui" value={stats.members.connectionsToday} icon={<Activity size={18} />} color="#38bdf8" />
      </div>

      {/* Trades KPIs */}
      {sectionLabel('📊', 'Activité de trading — toute la communauté')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginTop: '-1rem' }}>
        <KpiCard label="Total Trades" value={stats.trades.total} icon={<BarChart2 size={18} />} color={GOLD} />
        <KpiCard label="Win Rate Global" value={`${stats.trades.winRate.toFixed(1)}%`} icon={<Target size={18} />} color={stats.trades.winRate >= 50 ? GREEN : RED}
          trend={stats.trades.winRate >= 50 ? 'up' : 'down'} />
        <KpiCard label="Profits cumulés" value={`+$${stats.trades.totalProfit.toFixed(0)}`} icon={<TrendingUp size={18} />} color={GREEN}
          trend="up" />
        <KpiCard label="Pertes cumulées" value={`-$${stats.trades.totalLoss.toFixed(0)}`} icon={<TrendingDown size={18} />} color={RED}
          trend="down" />
        <KpiCard label="PnL Net Communauté" value={`${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(0)}`}
          icon={<DollarSign size={18} />} color={netPnL >= 0 ? GREEN : RED}
          sub="Gains – Pertes total" trend={netPnL >= 0 ? 'up' : 'down'} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* PnL mensuel */}
        {card(
          <>
            {chartTitle(<BarChart2 size={16} />, 'PnL mensuel de la communauté (6 mois)')}
            <div style={{ height: 240 }}><canvas ref={pnlRef} /></div>
          </>
        )}

        {/* Win/Loss donut */}
        {card(
          <>
            {chartTitle(<Target size={16} />, 'Répartition Gains / Pertes')}
            {stats.trades.total > 0 ? (
              <div style={{ height: 240 }}><canvas ref={donutRef} /></div>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                <BarChart2 size={40} style={{ opacity: 0.2 }} />
                <span style={{ fontSize: '0.85rem' }}>Aucun trade enregistré</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inscriptions chart - full width */}
      {card(
        <>
          {chartTitle(<Users size={16} />, 'Évolution des inscriptions (6 derniers mois)')}
          <div style={{ height: 220 }}><canvas ref={registrationsRef} /></div>
        </>
      )}

      {/* Activité récente */}
      {stats.recentActivity.length > 0 && card(
        <>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} style={{ color: GOLD }} /> Activité récente — dernières connexions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {stats.recentActivity.map((a) => (
              <div key={a.memberId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${GOLD}30, ${GOLD}10)`,
                    border: `1px solid ${GOLD}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: GOLD,
                  }}>
                    {a.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Dernière connexion : {new Date(a.lastLoginAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: GOLD }}>{a.tradesCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>trades</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Dernière actualisation : {lastRefresh.toLocaleTimeString('fr-FR')}
      </div>
    </div>
  );
};
