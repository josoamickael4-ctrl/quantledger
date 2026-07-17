import React from 'react';
import { TrendingUp, TrendingDown, Brain, Award } from 'lucide-react';

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
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  timeframe?: string | null;
}

interface StatsDashboardProps {
  trades: Trade[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ trades }) => {
  const totalTrades = trades.length;
  
  const gains = trades.filter((t) => t.resultat > 0);
  const pertes = trades.filter((t) => t.resultat < 0);
  
  const winRate = totalTrades > 0 ? Math.round((gains.length / totalTrades) * 100) : 0;
  
  const totalPnL = trades.reduce((acc, t) => acc + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
  
  const totalGains = gains.reduce((acc, t) => acc + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
  const totalPertes = Math.abs(pertes.reduce((acc, t) => acc + (typeof t.resultat === 'number' ? t.resultat : 0), 0));
  
  const profitFactor = totalPertes > 0 ? (totalGains / totalPertes).toFixed(2) : totalGains > 0 ? '∞' : '0.00';

  // Analyser l'impact émotionnel : somme des PnL par émotion
  const emotionStats: { [key: string]: { count: number; pnl: number } } = {};
  trades.forEach((t) => {
    const key = t.emotion.trim().toLowerCase();
    if (!emotionStats[key]) {
      emotionStats[key] = { count: 0, pnl: 0 };
    }
    emotionStats[key].count += 1;
    emotionStats[key].pnl += t.resultat;
  });

  // Trouver l'émotion la plus destructrice (PnL le plus négatif)
  let worstEmotion = '';
  let worstPnL = 0;
  Object.entries(emotionStats).forEach(([emotion, stat]) => {
    if (stat.pnl < worstPnL) {
      worstPnL = stat.pnl;
      worstEmotion = emotion;
    }
  });

  // SVG Progress Ring calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  return (
    <div className="coaching-panel">
      <div className="stats-grid">
        {/* Win Rate Card */}
        <div className="stat-card">
          <div className="stat-label">Taux de Réussite</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.25rem' }}>
            <div style={{ position: 'relative', width: '82px', height: '82px', flexShrink: 0 }}>
              <svg width="82" height="82" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                <circle
                  cx="41"
                  cy="41"
                  r={radius}
                  stroke="rgba(212, 175, 55, 0.08)"
                  strokeWidth="5"
                  fill="transparent"
                  style={{ r: `${radius}px` }}
                />
                <circle
                  cx="41"
                  cy="41"
                  r={radius}
                  stroke={winRate >= 50 ? 'var(--color-gain)' : 'var(--color-perte)'}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ r: `${radius}px`, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  filter={winRate >= 50 ? 'drop-shadow(0 0 4px var(--color-gain))' : 'drop-shadow(0 0 4px var(--color-perte))'}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: '800',
                fontFamily: 'Outfit',
                color: winRate >= 50 ? 'var(--color-gain)' : 'var(--color-perte)'
              }}>
                {winRate}%
              </div>
            </div>
            <div>
              <div className="stat-value">{winRate}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {gains.length} W - {pertes.length} L
              </div>
            </div>
          </div>
        </div>

        {/* PnL Total Card */}
        <div className={`stat-card ${totalPnL >= 0 ? 'gain' : 'perte'}`}>
          <div className="stat-label">PnL Net (USD)</div>
          <div className={`stat-value ${totalPnL >= 0 ? 'gain' : 'perte'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {totalPnL >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            {typeof totalPnL === 'number' && totalPnL >= 0 ? `+${totalPnL.toFixed(2)}` : typeof totalPnL === 'number' ? `${totalPnL.toFixed(2)}` : '0.00'} $
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Vol. total : {totalTrades} trades
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="stat-card">
          <div className="stat-label">Facteur de Profit</div>
          <div className="stat-value" style={{ color: Number(profitFactor) >= 1.5 || profitFactor === '∞' ? 'var(--color-gain)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Award size={22} />
            {profitFactor}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Gains {typeof totalGains === 'number' ? totalGains.toFixed(0) : '0'}$ / Pertes {typeof totalPertes === 'number' ? totalPertes.toFixed(0) : '0'}$
          </div>
        </div>
      </div>

      {/* Psychological Insight Box */}
      {totalTrades > 0 && (
        <div className="info-box">
          <Brain size={20} />
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Analyse comportementale du Mentor</span>
            </div>
            {worstPnL < 0 ? (
              <span>
                L'état émotionnel associé à tes plus grosses pertes est la **"{worstEmotion}"** (perte cumulée de **{Math.abs(worstPnL).toFixed(2)}$**). C'est ton talon d'Achille actuel sur l'Or. Attends d'avoir retrouvé ton calme avant de lancer un trade.
              </span>
            ) : (
              <span>
                Bonne gestion psychologique globale ! Tes performances ne montrent pas de dérive destructive liée à la peur ou à la cupidité. Poursuis avec la même rigueur.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
