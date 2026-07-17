import React, { useState, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw,
  Edit3,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CapitalEntry {
  id: string;
  date: string;          // ISO string
  type: 'depot' | 'retrait' | 'ajustement';
  montant: number;       // always positive; sign derived from type
  balanceApres: number;  // capital after this entry
  note: string;
}

interface CapitalPageProps {
  capital: number;
  capitalHistory: CapitalEntry[];
  onUpdateCapital: (newCapital: number, entry: Omit<CapitalEntry, 'id' | 'date' | 'balanceApres'>) => void;
  onDeleteEntry: (id: string) => void;
}

const TYPE_LABELS: Record<CapitalEntry['type'], string> = {
  depot: 'Dépôt',
  retrait: 'Retrait',
  ajustement: 'Ajustement manuel',
};

const TYPE_ICONS: Record<CapitalEntry['type'], React.ReactNode> = {
  depot: <Plus size={14} />,
  retrait: <Minus size={14} />,
  ajustement: <Edit3 size={14} />,
};

const TYPE_COLORS: Record<CapitalEntry['type'], string> = {
  depot: 'var(--color-gain)',
  retrait: 'var(--color-perte)',
  ajustement: 'var(--gold-primary)',
};

// ── Mini sparkline chart ──────────────────────────────────────────────────────
const SparkLine: React.FC<{ history: CapitalEntry[]; currentCapital: number }> = ({
  history,
  currentCapital,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 600;
  const H = 120;
  const PAD = 16;

  const points = [
    ...history.map((e) => e.balanceApres),
    currentCapital,
  ].filter((v) => typeof v === 'number' && !isNaN(v));

  if (points.length < 2) {
    return (
      <div
        style={{
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        Enregistrez des mouvements pour voir l'évolution de votre capital.
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  const pathD = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  const areaD =
    pathD +
    ` L ${toX(points.length - 1).toFixed(1)} ${H - PAD} L ${toX(0).toFixed(1)} ${H - PAD} Z`;

  const isUp = points[points.length - 1] >= points[0];
  const color = isUp ? 'var(--color-gain)' : 'var(--color-perte)';
  const gradientId = `cap-gradient-${isUp ? 'up' : 'down'}`;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={PAD}
          y1={PAD + (1 - p) * (H - PAD * 2)}
          x2={W - PAD}
          y2={PAD + (1 - p) * (H - PAD * 2)}
          stroke="rgba(197,160,89,0.06)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
      {/* Area */}
      <path d={areaD} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle
        cx={toX(points.length - 1)}
        cy={toY(points[points.length - 1])}
        r="5"
        fill={color}
        stroke="var(--bg-dark)"
        strokeWidth="2"
      />
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const CapitalPage: React.FC<CapitalPageProps> = ({
  capital,
  capitalHistory,
  onUpdateCapital,
  onDeleteEntry,
}) => {
  // Form state
  const [opType, setOpType] = useState<CapitalEntry['type']>('depot');
  const [montantStr, setMontantStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [newCapitalStr, setNewCapitalStr] = useState(''); // for "ajustement" direct value
  const [formError, setFormError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  // Reset form
  const resetForm = () => {
    setMontantStr('');
    setNoteStr('');
    setNewCapitalStr('');
    setFormError(null);
  };

  // Stats from history
  const totalDepots = capitalHistory
    .filter((e) => e.type === 'depot')
    .reduce((s, e) => s + e.montant, 0);
  const totalRetraits = capitalHistory
    .filter((e) => e.type === 'retrait')
    .reduce((s, e) => s + e.montant, 0);

  const variation = capitalHistory.length > 0
    ? capital - capitalHistory[0].balanceApres
    : 0;
  const variationPct = capitalHistory.length > 0 && capitalHistory[0].balanceApres !== 0
    ? (variation / capitalHistory[0].balanceApres) * 100
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (opType === 'ajustement') {
      const nc = parseFloat(newCapitalStr);
      if (isNaN(nc) || nc < 0) {
        setFormError('Entrez un capital valide (≥ 0).');
        return;
      }
      const diff = nc - capital;
      onUpdateCapital(nc, {
        type: 'ajustement',
        montant: Math.abs(diff),
        note: noteStr.trim() || `Ajustement manuel → ${nc.toFixed(2)} $`,
      });
    } else {
      const m = parseFloat(montantStr);
      if (isNaN(m) || m <= 0) {
        setFormError('Le montant doit être supérieur à 0.');
        return;
      }
      const newCapital = opType === 'depot' ? capital + m : capital - m;
      if (newCapital < 0) {
        setFormError('Le retrait dépasse le capital disponible.');
        return;
      }
      onUpdateCapital(newCapital, {
        type: opType,
        montant: m,
        note: noteStr.trim() || (opType === 'depot' ? `Dépôt de ${m} $` : `Retrait de ${m} $`),
      });
    }
    resetForm();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Sort history newest first for display
  const sortedHistory = [...capitalHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Wallet className="brand-icon" style={{ width: 24, height: 24 }} />
            Gestion du Capital
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Suivez l'évolution de votre compte trading en temps réel.
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Capital actuel */}
        <div
          className="stat-card"
          style={{
            border: '1px solid var(--gold-secondary)',
            boxShadow: 'var(--shadow-gold)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '3px',
              background: 'var(--gold-gradient)',
            }}
          />
          <div className="stat-label">💰 Capital Actuel</div>
          <div
            className="stat-value"
            style={{ color: 'var(--gold-primary)', fontSize: '1.6rem' }}
          >
            {formatCurrency(capital)} $
          </div>
          {capitalHistory.length > 0 && (
            <div
              style={{
                fontSize: '0.72rem',
                color: variation >= 0 ? 'var(--color-gain)' : 'var(--color-perte)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginTop: '0.25rem',
              }}
            >
              {variation >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {variation >= 0 ? '+' : ''}{formatCurrency(variation)} $ ({variationPct >= 0 ? '+' : ''}{variationPct.toFixed(2)}%)
            </div>
          )}
        </div>

        {/* Total dépôts */}
        <div className="stat-card">
          <div className="stat-label">📥 Total Dépôts</div>
          <div className="stat-value" style={{ color: 'var(--color-gain)' }}>
            +{formatCurrency(totalDepots)} $
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {capitalHistory.filter((e) => e.type === 'depot').length} opération(s)
          </div>
        </div>

        {/* Total retraits */}
        <div className="stat-card">
          <div className="stat-label">📤 Total Retraits</div>
          <div className="stat-value" style={{ color: 'var(--color-perte)' }}>
            -{formatCurrency(totalRetraits)} $
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {capitalHistory.filter((e) => e.type === 'retrait').length} opération(s)
          </div>
        </div>

        {/* Nb opérations */}
        <div className="stat-card">
          <div className="stat-label">📋 Opérations</div>
          <div className="stat-value">{capitalHistory.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            mouvements enregistrés
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {capitalHistory.length > 0 && (
        <div
          className="card"
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            <TrendingUp size={18} />
            Évolution du Capital
          </h3>
          <SparkLine
            history={[...capitalHistory].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )}
            currentCapital={capital}
          />
        </div>
      )}

      <div
        className="main-layout"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
      >
        {/* ── Form Card ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            <Edit3 size={18} />
            Modifier le Capital
          </h3>

          {/* Type selector */}
          <div className="form-group">
            <label className="form-label">Type d'opération</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {(['depot', 'retrait', 'ajustement'] as CapitalEntry['type'][]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setOpType(t); setFormError(null); }}
                  style={{
                    padding: '0.7rem 0.4rem',
                    borderRadius: '10px',
                    border: `1px solid ${opType === t ? TYPE_COLORS[t] : 'var(--border-color)'}`,
                    background:
                      opType === t
                        ? t === 'depot'
                          ? 'rgba(0,230,118,0.1)'
                          : t === 'retrait'
                          ? 'rgba(255,23,68,0.1)'
                          : 'rgba(197,160,89,0.1)'
                        : 'rgba(8,9,13,0.4)',
                    color: opType === t ? TYPE_COLORS[t] : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {TYPE_ICONS[t]}
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {opType === 'ajustement' ? (
              <div className="form-group">
                <label className="form-label" htmlFor="cap-new-value">
                  Nouveau capital ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="cap-new-value"
                    type="number"
                    step="any"
                    min="0"
                    className="input-field"
                    value={newCapitalStr}
                    onChange={(e) => setNewCapitalStr(e.target.value)}
                    placeholder={formatCurrency(capital)}
                    required
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    $
                  </span>
                </div>
                {newCapitalStr && !isNaN(parseFloat(newCapitalStr)) && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color:
                        parseFloat(newCapitalStr) >= capital
                          ? 'var(--color-gain)'
                          : 'var(--color-perte)',
                      marginTop: '0.35rem',
                    }}
                  >
                    {parseFloat(newCapitalStr) >= capital ? '▲' : '▼'} Différence :{' '}
                    {parseFloat(newCapitalStr) >= capital ? '+' : ''}
                    {formatCurrency(parseFloat(newCapitalStr) - capital)} $
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="cap-montant">
                  Montant ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="cap-montant"
                    type="number"
                    step="any"
                    min="0.01"
                    className="input-field"
                    value={montantStr}
                    onChange={(e) => setMontantStr(e.target.value)}
                    placeholder="ex: 500"
                    required
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    $
                  </span>
                </div>
                {montantStr && !isNaN(parseFloat(montantStr)) && parseFloat(montantStr) > 0 && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: opType === 'depot' ? 'var(--color-gain)' : 'var(--color-perte)',
                      marginTop: '0.35rem',
                    }}
                  >
                    Capital après :{' '}
                    {formatCurrency(
                      opType === 'depot'
                        ? capital + parseFloat(montantStr)
                        : capital - parseFloat(montantStr)
                    )}{' '}
                    $
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="cap-note">
                Note (optionnel)
              </label>
              <input
                id="cap-note"
                type="text"
                className="input-field"
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
                placeholder="ex: Gain de trading mensuel"
                maxLength={120}
              />
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(255,23,68,0.1)',
                  border: '1px solid rgba(255,23,68,0.3)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  color: 'var(--color-perte)',
                  fontSize: '0.82rem',
                }}
              >
                ⚠ {formError}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              style={{
                background:
                  opType === 'depot'
                    ? 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,230,118,0.1))'
                    : opType === 'retrait'
                    ? 'linear-gradient(135deg, rgba(255,23,68,0.2), rgba(255,23,68,0.1))'
                    : undefined,
                borderColor:
                  opType === 'depot'
                    ? 'var(--color-gain)'
                    : opType === 'retrait'
                    ? 'var(--color-perte)'
                    : undefined,
                color:
                  opType === 'depot'
                    ? 'var(--color-gain)'
                    : opType === 'retrait'
                    ? 'var(--color-perte)'
                    : undefined,
              }}
            >
              {opType === 'depot' && <Plus size={16} />}
              {opType === 'retrait' && <Minus size={16} />}
              {opType === 'ajustement' && <RefreshCw size={16} />}
              {TYPE_LABELS[opType]}
            </button>
          </form>

          {/* Info tip */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              background: 'rgba(197,160,89,0.05)',
              border: '1px solid rgba(197,160,89,0.15)',
              borderRadius: '8px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
            }}
          >
            <Info size={14} style={{ flexShrink: 0, color: 'var(--gold-secondary)', marginTop: '0.1rem' }} />
            <span>
              Le capital est utilisé dans la <strong style={{ color: 'var(--gold-primary)' }}>Calculatrice de Lot</strong> pour pré-remplir automatiquement le solde du compte.
            </span>
          </div>
        </div>

        {/* ── History Card ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 0,
              width: '100%',
            }}
          >
            <h3 className="card-title" style={{ marginBottom: 0, pointerEvents: 'none' }}>
              <RefreshCw size={18} />
              Historique des Mouvements
              <span
                style={{
                  marginLeft: '0.5rem',
                  background: 'var(--gold-secondary)',
                  color: '#000',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.45rem',
                  fontWeight: 700,
                }}
              >
                {capitalHistory.length}
              </span>
            </h3>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHistory && (
            <>
              {sortedHistory.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Wallet size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p>Aucun mouvement enregistré.</p>
                  <p>Effectuez un dépôt ou un ajustement pour commencer.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem',
                  }}
                >
                  {sortedHistory.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'rgba(8,9,13,0.4)',
                        border: `1px solid rgba(${
                          entry.type === 'depot'
                            ? '0,230,118'
                            : entry.type === 'retrait'
                            ? '255,23,68'
                            : '197,160,89'
                        },0.15)`,
                        borderRadius: '10px',
                        padding: '0.7rem 0.9rem',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background:
                            entry.type === 'depot'
                              ? 'rgba(0,230,118,0.12)'
                              : entry.type === 'retrait'
                              ? 'rgba(255,23,68,0.12)'
                              : 'rgba(197,160,89,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: TYPE_COLORS[entry.type],
                          flexShrink: 0,
                        }}
                      >
                        {TYPE_ICONS[entry.type]}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.83rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {entry.note}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {formatDate(entry.date)} · Solde après : {formatCurrency(entry.balanceApres)} $
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: TYPE_COLORS[entry.type],
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {entry.type === 'depot'
                          ? `+${formatCurrency(entry.montant)}`
                          : entry.type === 'retrait'
                          ? `-${formatCurrency(entry.montant)}`
                          : `~${formatCurrency(entry.montant)}`}{' '}
                        $
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Supprimer ce mouvement"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '0.25rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--color-perte)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
