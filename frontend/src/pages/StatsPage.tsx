import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement,
  DoughnutController, ArcElement,
  Tooltip, Legend, Filler,
  type ChartConfiguration
} from 'chart.js';
import { TrendingUp, BarChart2, Target, Brain, DollarSign, Layers, Globe, Printer } from 'lucide-react';

// Register all needed Chart.js components
Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement,
  DoughnutController, ArcElement,
  Tooltip, Legend, Filler
);

interface Trade {
  id?: string;
  actif: string;
  position: 'Achat' | 'Vente';
  prixEntree: number;
  stopLoss: number;
  takeProfit: number;
  resultat: number;
  contexte: string;
  emotion: string;
  createdAt?: string;
  analyseMentor?: string;
  strategyName?: string;
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  lots?: number;
  timeframe?: string | null;
  prixSortie?: number;
  checkedRules?: string[];
  strategyRulesTotalCount?: number;
}

interface StatsPageProps {
  trades: Trade[];
  capital?: number;
}

// Shared Chart.js theme defaults
const GOLD = '#ffd700';
const GOLD_FADED = 'rgba(255,215,0,0.15)';
const GREEN = '#00e676';
const RED = '#ff1744';
const GRID_COLOR = 'rgba(197,160,89,0.08)';
const TICK_COLOR = '#6b7280';
const FONT_FAMILY = "'Plus Jakarta Sans', sans-serif";

const SESSION_COLORS: Record<string, string> = {
  'Asie': '#7c3aed',
  'Londres': '#0ea5e9',
  'New York': '#f59e0b',
  'Overlap': '#10b981',
};

function useChart(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: ChartConfiguration | null
) {
  const chartRef = useRef<Chart | null>(null);
  useEffect(() => {
    if (!canvasRef.current || !config) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, config);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [config]);
}

export const StatsPage: React.FC<StatsPageProps> = ({ trades, capital }) => {
  const equityRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const stratRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<HTMLCanvasElement>(null);

  // Calcul du PnL total en amont pour déterminer le capital de départ si le solde actuel est fourni
  const totalPnL = trades.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);

  // ─── Capital Initial de référence pour le Drawdown ─────────────────────────
  const [capitalInput, setCapitalInput] = useState<string>(() =>
    localStorage.getItem('journal_initial_capital') || '6531.46'
  );

  const initialCapital = capital !== undefined 
    ? (capital - totalPnL) 
    : (Math.max(100, parseFloat(capitalInput) || 6531.46));

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCapitalInput(e.target.value);
    localStorage.setItem('journal_initial_capital', e.target.value);
  };

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
  );

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.resultat > 0);
  const losses = trades.filter(t => t.resultat < 0);
  const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;
  const totalGains = wins.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? '∞' : '0.00';
  const avgWin = wins.length > 0 ? (totalGains / wins.length) : 0;
  const avgLoss = losses.length > 0 ? (totalLosses / losses.length) : 0;

  // Expectancy = (WinRate × AvgWin) – (LossRate × AvgLoss)
  const winRateDec = wins.length / (totalTrades || 1);
  const lossRateDec = losses.length / (totalTrades || 1);
  const expectancy = winRateDec * avgWin - lossRateDec * avgLoss;

  // ─── Max Drawdown & Double Equity Curves ────────────────────────────────────
  let peak = initialCapital;
  let maxDD_abs = 0;
  let maxDD_pct = 0;
  let equity = initialCapital;
  const equityData: number[] = [];

  // Équité Discipline (Théorique)
  let disciplineEquity = initialCapital;
  const disciplineEquityData: number[] = [];

  for (const t of sortedTrades) {
    // Calcul de l'équité réelle
    equity += (typeof t.resultat === 'number' ? t.resultat : 0);
    equityData.push(equity);

    // Calcul du drawdown réel
    if (equity > peak) peak = equity;
    const dd_abs = peak - equity;
    const dd_pct = peak > 0 ? (dd_abs / peak) * 100 : 0;
    if (dd_abs > maxDD_abs) maxDD_abs = dd_abs;
    if (dd_pct > maxDD_pct) maxDD_pct = dd_pct;

    // Calcul de l'équité théorique de discipline
    const hasStrategy = !!t.strategyName;
    const allRulesChecked = hasStrategy && t.checkedRules && t.strategyRulesTotalCount
      ? t.checkedRules.length === t.strategyRulesTotalCount
      : false;

    if (hasStrategy && allRulesChecked) {
      disciplineEquity += (typeof t.resultat === 'number' ? t.resultat : 0);
    }
    disciplineEquityData.push(disciplineEquity);
  }

  const equityLabels = sortedTrades.map((t, i) => {
    if (t.createdAt) return new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `T${i + 1}`;
  });
  const equityColor = totalPnL >= 0 ? GREEN : RED;

  // ─── PnL par Stratégie ─────────────────────────────────────────────────────
  const stratPnl: Record<string, number> = {};
  for (const t of trades) {
    const key = t.strategyName || 'Discrétionnaire';
    stratPnl[key] = (stratPnl[key] || 0) + (typeof t.resultat === 'number' ? t.resultat : 0);
  }
  const stratLabels = Object.keys(stratPnl);
  const stratData = stratLabels.map(k => stratPnl[k]);

  // ─── PnL par Session ──────────────────────────────────────────────────────
  const sessionPnl: Record<string, number> = {};
  for (const t of trades) {
    const key = t.session || 'Non renseignée';
    sessionPnl[key] = (sessionPnl[key] || 0) + (typeof t.resultat === 'number' ? t.resultat : 0);
  }
  const sessionLabels = Object.keys(sessionPnl);
  const sessionData = sessionLabels.map(k => sessionPnl[k]);

  // ─── Chart configs ─────────────────────────────────────────────────────────
  const equityConfig: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: equityLabels.length > 0 ? equityLabels : ['Aucun trade'],
      datasets: [
        {
          label: 'Équité Réelle ($)',
          data: equityData.length > 0 ? equityData : [initialCapital],
          borderColor: equityColor,
          backgroundColor: equityData.length > 0 ? `${equityColor}08` : 'transparent',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: equityColor,
          pointRadius: equityData.length <= 15 ? 4 : 1,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
        {
          label: 'Équité Discipline ($)',
          data: disciplineEquityData.length > 0 ? disciplineEquityData : [initialCapital],
          borderColor: 'var(--gold-primary)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'var(--gold-primary)',
          pointRadius: disciplineEquityData.length <= 15 ? 4 : 1,
          pointHoverRadius: 6,
          borderWidth: 2,
          borderDash: [5, 5],
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#9ca3af',
            font: { family: FONT_FAMILY, size: 11 },
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          backgroundColor: '#0f111a', borderColor: GOLD_FADED, borderWidth: 1,
          titleColor: GOLD, bodyColor: '#f3f4f6',
          callbacks: {
            label: ctx => {
              const y = ctx.parsed.y ?? 0;
              return ` ${ctx.dataset.label} : ${y.toFixed(2)} $`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 } } },
        y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 }, callback: v => `${v}$`, maxTicksLimit: 10 } }
      }
    }
  };

  const barConfig: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: sortedTrades.map((t, i) => t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : `T${i + 1}`),
      datasets: [{
        label: 'PnL ($)',
        data: sortedTrades.map(t => typeof t.resultat === 'number' ? t.resultat : 0),
        backgroundColor: sortedTrades.map(t => typeof t.resultat === 'number' && t.resultat >= 0 ? `${GREEN}cc` : `${RED}cc`),
        borderColor: sortedTrades.map(t => typeof t.resultat === 'number' && t.resultat >= 0 ? GREEN : RED),
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f111a', borderColor: GOLD_FADED, borderWidth: 1,
          titleColor: GOLD, bodyColor: '#f3f4f6',
          callbacks: { label: ctx => { const y = ctx.parsed.y ?? 0; return ` ${y >= 0 ? '+' : ''}${y} $`; } }
        }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 } } },
        y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 }, callback: v => `${v}$`, maxTicksLimit: 10 } }
      }
    }
  };

  const donutConfig: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: ['Gagnants', 'Perdants'],
      datasets: [{
        data: [wins.length || 0, losses.length || 0],
        backgroundColor: [`${GREEN}cc`, `${RED}cc`],
        borderColor: [GREEN, RED],
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#9ca3af', font: { family: FONT_FAMILY, size: 12 }, padding: 16, boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#0f111a', borderColor: GOLD_FADED, borderWidth: 1,
          titleColor: GOLD, bodyColor: '#f3f4f6',
          callbacks: { label: ctx => ` ${ctx.label} : ${ctx.parsed} trades` }
        }
      }
    }
  };

  const stratConfig: ChartConfiguration<'bar'> | null = stratLabels.length > 0 ? {
    type: 'bar',
    data: {
      labels: stratLabels,
      datasets: [{
        label: 'PnL Net ($)',
        data: stratData,
        backgroundColor: stratData.map(v => v >= 0 ? `${GREEN}bb` : `${RED}bb`),
        borderColor: stratData.map(v => v >= 0 ? GREEN : RED),
        borderWidth: 1.5,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f111a', borderColor: GOLD_FADED, borderWidth: 1,
          titleColor: GOLD, bodyColor: '#f3f4f6',
          callbacks: { label: ctx => { const y = ctx.parsed.x ?? 0; return ` ${y >= 0 ? '+' : ''}${y.toFixed(2)} $`; } }
        }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 }, callback: v => `${v}$` } },
        y: { grid: { color: 'transparent' }, ticks: { color: '#d1d5db', font: { family: FONT_FAMILY, size: 12 } } }
      }
    }
  } : null;

  const sessionConfig: ChartConfiguration<'bar'> | null = sessionLabels.length > 0 ? {
    type: 'bar',
    data: {
      labels: sessionLabels,
      datasets: [{
        label: 'PnL Net ($)',
        data: sessionData,
        backgroundColor: sessionLabels.map(l => SESSION_COLORS[l] ? `${SESSION_COLORS[l]}bb` : `${GOLD}bb`),
        borderColor: sessionLabels.map(l => SESSION_COLORS[l] || GOLD),
        borderWidth: 1.5,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f111a', borderColor: GOLD_FADED, borderWidth: 1,
          titleColor: GOLD, bodyColor: '#f3f4f6',
          callbacks: { label: ctx => { const y = ctx.parsed.y ?? 0; return ` ${y >= 0 ? '+' : ''}${y.toFixed(2)} $`; } }
        }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 } } },
        y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: FONT_FAMILY, size: 11 }, callback: v => `${v}$`, maxTicksLimit: 10 } }
      }
    }
  } : null;

  useChart(equityRef, totalTrades > 0 ? equityConfig : null);
  useChart(barRef, totalTrades > 0 ? barConfig : null);
  useChart(donutRef, totalTrades > 0 ? donutConfig : null);
  useChart(stratRef, totalTrades > 0 ? stratConfig : null);
  useChart(sessionRef, totalTrades > 0 ? sessionConfig : null);

  // Emotion analysis table
  const emotionStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  trades.forEach(t => {
    const k = t.emotion.trim();
    if (!emotionStats[k]) emotionStats[k] = { count: 0, pnl: 0, wins: 0 };
    emotionStats[k].count += 1;
    emotionStats[k].pnl += (typeof t.resultat === 'number' ? t.resultat : 0);
    if (typeof t.resultat === 'number' && t.resultat > 0) emotionStats[k].wins += 1;
  });
  const emotionRows = Object.entries(emotionStats).sort((a, b) => b[1].pnl - a[1].pnl);

  // Calculs pour le profil psychologique
  let worstEmotion = '';
  let worstEmotionPnl = 0;
  let bestEmotion = '';
  let bestEmotionPnl = -Infinity;
  let emotionalLeak = 0;

  const negativeEmotionsList = [
    'Impatient / Pressé', 
    'FOMO / Peur de rater le mouvement', 
    'Stressé / Tendu', 
    'Frustré / Revenge trading'
  ];

  Object.entries(emotionStats).forEach(([emo, stats]) => {
    if (stats.pnl < worstEmotionPnl) {
      worstEmotionPnl = stats.pnl;
      worstEmotion = emo;
    }
    if (stats.pnl > bestEmotionPnl) {
      bestEmotionPnl = stats.pnl;
      bestEmotion = emo;
    }
    // Si c'est une émotion négative et qu'elle a généré des pertes
    if (negativeEmotionsList.some(ne => emo.toLowerCase().includes(ne.split(' ')[0].toLowerCase()))) {
      if (stats.pnl < 0) {
        emotionalLeak += stats.pnl;
      }
    }
  });

  const getWorstEmotionAdvice = (emo: string) => {
    const key = emo.toLowerCase();
    if (key.includes('fomo') || key.includes('rater')) {
      return "Le FOMO (Fear Of Missing Out) traduit un manque de confiance dans vos zones de prix. L'Or ne part jamais sans laisser de traces : si vous ratez un mouvement, attendez le re-test ou le prochain setup. Mieux vaut rater un trade que perdre du capital.";
    }
    if (key.includes('impatient') || key.includes('pressé')) {
      return "L'impatience découle d'une envie de trader pour l'adrénaline plutôt que pour le profit. Forcez-vous à attendre une confirmation en bougie H1 ou M15 complète avant d'entrer. Le marché récompense ceux qui savent attendre.";
    }
    if (key.includes('revenge') || key.includes('frustré')) {
      return "Le revenge trading est le moyen le plus rapide de détruire un compte. Après une perte, coupez immédiatement vos écrans pendant au moins 2 heures. La perte fait partie du jeu, pas la vengeance.";
    }
    if (key.includes('stress') || key.includes('tendu')) {
      return "Le stress est le signe direct que votre taille de lot est trop élevée pour votre psychologie. Divisez vos lots par deux jusqu'à ce que l'ouverture d'une position ne provoque plus de réaction émotionnelle ou physique.";
    }
    if (key.includes('excès') || key.includes('euphorique')) {
      return "L'euphorie après une série de gains engendre de la négligence et des tailles de lots démesurées. Restez humble : le marché XAU/USD récupère toujours l'argent des traders trop confiants.";
    }
    return "Conservez votre calme et votre discipline. Notez vos sensations après chaque trade pour maintenir cet état d'esprit pro.";
  };

  const worstEmotionAdvice = worstEmotion ? getWorstEmotionAdvice(worstEmotion) : '';

  const KPI = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || 'var(--gold-primary)', fontSize: '1.6rem' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="stats-page">

      {/* Print-only Header letterhead */}
      <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '2px solid var(--gold-secondary)', paddingBottom: '1rem' }}>
        <h1 style={{ color: 'var(--gold-primary)', fontSize: '2rem', marginBottom: '0.2rem', fontFamily: 'Outfit, sans-serif' }}>
          JOURNAL DE TRADING XAU/USD — RAPPORT DE PERFORMANCE
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Généré automatiquement le {new Date().toLocaleDateString('fr-FR')} | Capital Référent : {initialCapital.toFixed(2)} $
        </p>
      </div>

      {/* Action Bar (Screen only) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Statistiques Analytiques
        </h2>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            background: 'var(--gold-gradient)',
            border: 'none',
            borderRadius: '8px',
            color: '#06070a',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Printer size={16} />
          Exporter le Rapport (PDF)
        </button>
      </div>

      {/* Capital Initial Input */}
      <div className="card no-print" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1rem 1.4rem', flexWrap: 'wrap' }}>
        <DollarSign size={20} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Capital de Départ Référent
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {capital !== undefined 
              ? "Calculé automatiquement d'après votre solde de compte actuel et vos résultats de trades."
              : "Définissez votre solde de départ pour calculer le Max Drawdown réel en %."}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {capital !== undefined ? (
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT_FAMILY }}>
              {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(initialCapital)}
            </span>
          ) : (
            <input
              type="number"
              min="100"
              step="100"
              value={capitalInput}
              onChange={handleCapitalChange}
              style={{
                width: '120px',
                background: 'rgba(197,160,89,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: FONT_FAMILY,
                textAlign: 'right',
              }}
            />
          )}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>USD</span>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="stats-kpi-row">
        <KPI label="Total Trades" value={totalTrades} sub={`${wins.length}W – ${losses.length}L`} />
        <KPI label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? GREEN : RED} sub="Taux de réussite" />
        <KPI label="PnL Net" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)} $`} color={totalPnL >= 0 ? GREEN : RED} sub="Gains – Pertes" />
        <KPI label="Profit Factor" value={profitFactor} color={Number(profitFactor) >= 1.5 || profitFactor === '∞' ? GREEN : 'var(--text-primary)'} sub="Ratio gains / pertes" />
        <KPI label="Gain Moy." value={`+${avgWin.toFixed(0)} $`} color={GREEN} sub="Par trade gagnant" />
        <KPI label="Perte Moy." value={`-${avgLoss.toFixed(0)} $`} color={RED} sub="Par trade perdant" />
      </div>

      {/* KPI Row 2 – Risk Metrics */}
      <div className="stats-kpi-row">
        <KPI
          label="Max Drawdown ($)"
          value={totalTrades > 0 ? `-${maxDD_abs.toFixed(0)} $` : '—'}
          color={maxDD_abs > 0 ? RED : 'var(--text-secondary)'}
          sub="Perte max depuis un pic"
        />
        <KPI
          label="Max Drawdown (%)"
          value={totalTrades > 0 ? `-${maxDD_pct.toFixed(2)} %` : '—'}
          color={maxDD_pct > 10 ? RED : maxDD_pct > 5 ? '#ffa751' : GREEN}
          sub={`Référence : ${initialCapital.toLocaleString('fr-FR')} $`}
        />
        <KPI
          label="Espérance (Expectancy)"
          value={totalTrades > 0 ? `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)} $` : '—'}
          color={expectancy > 0 ? GREEN : expectancy < 0 ? RED : 'var(--text-secondary)'}
          sub="Gain moyen par trade"
        />
        <KPI
          label="Capital Actuel"
          value={totalTrades > 0 ? `${equity.toFixed(0)} $` : `${initialCapital.toLocaleString('fr-FR')} $`}
          color={equity >= initialCapital ? GREEN : RED}
          sub={equity >= initialCapital ? `+${(equity - initialCapital).toFixed(0)} $ vs départ` : `${(equity - initialCapital).toFixed(0)} $ vs départ`}
        />
      </div>

      {/* Charts grid */}
      {totalTrades === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <BarChart2 size={56} style={{ color: 'var(--gold-secondary)', opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Aucune donnée disponible</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ajoutez des trades dans votre journal pour voir les graphiques ici.</p>
        </div>
      ) : (
        <div className="charts-grid">
          {/* Equity Curve - Full Width */}
          <div className="chart-card full-width">
            <div className="chart-title"><TrendingUp size={18} /> Courbe d'Équité (solde depuis {initialCapital.toLocaleString('fr-FR')} $)</div>
            <div className="chart-container">
              <canvas ref={equityRef} />
            </div>
          </div>

          {/* PnL per Trade bar */}
          <div className="chart-card">
            <div className="chart-title"><BarChart2 size={18} /> PnL par Trade</div>
            <div className="chart-container">
              <canvas ref={barRef} />
            </div>
          </div>

          {/* Donut Win/Loss */}
          <div className="chart-card">
            <div className="chart-title"><Target size={18} /> Répartition Gains / Pertes</div>
            <div className="chart-container">
              <canvas ref={donutRef} />
            </div>
          </div>

          {/* PnL by Strategy */}
          <div className="chart-card">
            <div className="chart-title"><Layers size={18} /> Performance par Stratégie</div>
            {stratLabels.length > 0 ? (
              <div className="chart-container">
                <canvas ref={stratRef} />
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem' }}>Aucune stratégie associée aux trades.</p>
            )}
          </div>

          {/* PnL by Session */}
          <div className="chart-card">
            <div className="chart-title"><Globe size={18} /> Performance par Session</div>
            {sessionLabels.length > 0 ? (
              <div className="chart-container">
                <canvas ref={sessionRef} />
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem' }}>Aucune session enregistrée dans vos trades.</p>
            )}
          </div>

          {/* AI Psychological and Cognitive Profiler */}
          <div className="chart-card full-width">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={18} style={{ color: 'var(--gold-primary)' }} /> 
              <span>Profil de Performance Cognitive &amp; Émotionnelle</span>
            </div>

            {emotionRows.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem' }}>
                Aucune donnée d'émotion enregistrée pour le moment.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
                {/* 1. Psychological Insights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* Leak Card */}
                  <div style={{
                    background: 'rgba(255, 23, 68, 0.03)',
                    border: '1px solid rgba(255, 23, 68, 0.15)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff1744', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ⚡ Fuite de Capital Émotionnelle (Leak)
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff1744', fontFamily: 'monospace' }}>
                      {emotionalLeak.toFixed(2)} $
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Pertes cumulées sous l'effet d'émotions négatives (FOMO, Impatience, Revenge trading, Stress).
                    </span>
                  </div>

                  {/* Best/Worst State Card */}
                  <div style={{
                    background: 'rgba(197, 160, 89, 0.03)',
                    border: '1px solid rgba(197, 160, 89, 0.15)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        😇 État le Plus Rentable
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: GREEN, marginTop: '0.15rem' }}>
                        {bestEmotion || '—'} {bestEmotionPnl > -Infinity && `(${bestEmotionPnl.toFixed(0)} $)`}
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(197, 160, 89, 0.1)', paddingTop: '0.4rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        😈 Pire Biais Émotionnel
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: RED, marginTop: '0.15rem' }}>
                        {worstEmotion || 'Aucun'} {worstEmotion && `(${worstEmotionPnl.toFixed(0)} $)`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Mentor AI Diagnostic Advice Box */}
                {worstEmotion && (
                  <div className="mentor-advice-box" style={{
                    background: 'rgba(197, 160, 89, 0.04)',
                    border: '1px solid rgba(197, 160, 89, 0.25)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🧠</span>
                      <strong style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Diagnostic du Mentor : Vaincre l'effet "{worstEmotion}"
                      </strong>
                    </div>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.55',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      "{worstEmotionAdvice}"
                    </p>
                  </div>
                )}

                {/* 3. Redesigned Performance Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="emotion-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>État Émotionnel</th>
                        <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Trades</th>
                        <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Taux de Réussite</th>
                        <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>PnL Cumulé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emotionRows.map(([emotion, stats]) => {
                        const wr = Math.round((stats.wins / stats.count) * 100);
                        const isPositive = stats.pnl >= 0;
                        const isNegativeEmotion = negativeEmotionsList.some(ne => emotion.toLowerCase().includes(ne.split(' ')[0].toLowerCase()));
                        
                        return (
                          <tr key={emotion} style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.04)' }}>
                            <td style={{ padding: '0.9rem 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{isNegativeEmotion ? '⚠️' : '🛡️'}</span>
                                <span>{emotion}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.9rem 0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {stats.count}
                            </td>
                            <td style={{ padding: '0.9rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
                                <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${wr}%`,
                                    height: '100%',
                                    background: wr >= 50 ? GREEN : RED,
                                    borderRadius: '2px'
                                  }} />
                                </div>
                                <span style={{ color: wr >= 50 ? GREEN : RED, fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', width: '32px', textAlign: 'right' }}>
                                  {wr}%
                                </span>
                              </div>
                            </td>
                            <td style={{
                              textAlign: 'right',
                              padding: '0.9rem 0.5rem',
                              color: isPositive ? GREEN : RED,
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              fontSize: '0.88rem'
                            }}>
                              {isPositive ? `+${stats.pnl.toFixed(2)}` : `${stats.pnl.toFixed(2)}`} $
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
