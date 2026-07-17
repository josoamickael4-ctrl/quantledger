import React, { useState, useMemo } from 'react';
import {
  Search, Pencil, Trash2, ImageIcon, AlertCircle,
  Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Filter, TrendingUp, TrendingDown, Target
} from 'lucide-react';

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
  imageBase64?: string;
  createdAt?: string;
  analyseMentor?: string;
  strategyId?: string;
  strategyName?: string;
  checkedRules?: string[];
  strategyRulesTotalCount?: number;
  lots?: number;
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | null;
  prixSortie?: number;
}

interface TradesListPageProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => Promise<void>;
  onSelectTrade?: (trade: Trade) => void;
}

type SortKey = 'date' | 'actif' | 'pnl' | 'lots' | 'session' | 'rr' | 'strategie';
type SortDir = 'asc' | 'desc';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const SESSION_COLORS: Record<string, string> = {
  'Asie': '#7c3aed',
  'Londres': '#0ea5e9',
  'New York': '#f59e0b',
  'Overlap': '#10b981',
};

function getRealRR(trade: Trade): number | null {
  const slDist = Math.abs(trade.prixEntree - trade.stopLoss);
  if (!trade.prixSortie || slDist === 0) return null;
  const realDist = trade.position === 'Achat'
    ? trade.prixSortie - trade.prixEntree
    : trade.prixEntree - trade.prixSortie;
  return realDist / slDist;
}

function exportToCSV(trades: Trade[]) {
  const headers = [
    'Date', 'Actif', 'Position', 'Entrée', 'Stop Loss', 'Take Profit',
    'Sortie', 'Lots', 'Session', 'Timeframe', 'Stratégie',
    'PnL (USD)', 'R:R Réel', 'Émotion', 'Contexte'
  ];

  const rows = trades.map(t => {
    const rr = getRealRR(t);
    return [
      t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '',
      t.actif,
      t.position,
      t.prixEntree,
      t.stopLoss,
      t.takeProfit,
      t.prixSortie ?? '',
      t.lots ?? '',
      t.session ?? '',
      t.timeframe ?? '',
      t.strategyName ?? 'Discrétionnaire',
      typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00',
      rr !== null && typeof rr === 'number' ? rr.toFixed(2) : '',
      t.emotion,
      `"${t.contexte.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trading_journal_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const TradesListPage: React.FC<TradesListPageProps> = ({
  trades,
  onEditTrade,
  onDeleteTrade,
  onSelectTrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('Tous');
  const [selectedMonth, setSelectedMonth] = useState<number | 'Tous'>('Tous');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // New filters
  const [filterSession, setFilterSession] = useState('Tous');
  const [filterStrategie, setFilterStrategie] = useState('Tous');
  const [filterResultat, setFilterResultat] = useState<'Tous' | 'Gain' | 'Perte'>('Tous');
  const [filterActif, setFilterActif] = useState('Tous');

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Unique values for filter dropdowns
  const uniqueYears = useMemo(() =>
    Array.from(new Set(trades.map(t => t.createdAt ? new Date(t.createdAt).getFullYear().toString() : '').filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [trades]
  );
  const uniqueSessions = useMemo(() => ['Tous', ...Array.from(new Set(trades.map(t => t.session).filter(Boolean) as string[]))], [trades]);
  const uniqueStrategies = useMemo(() => ['Tous', ...Array.from(new Set(trades.map(t => t.strategyName || 'Discrétionnaire')))], [trades]);
  const uniqueActifs = useMemo(() => ['Tous', ...Array.from(new Set(trades.map(t => t.actif)))], [trades]);

  // Filter + sort pipeline
  const filteredAndSorted = useMemo(() => {
    let result = trades.filter(t => {
      // Date filters
      if (t.createdAt) {
        const date = new Date(t.createdAt);
        if (selectedYear !== 'Tous' && date.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth !== 'Tous' && date.getMonth() !== selectedMonth) return false;
      }
      // Text search
      const q = searchQuery.toLowerCase();
      if (q && !(
        t.actif.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q) ||
        t.contexte.toLowerCase().includes(q) ||
        t.emotion.toLowerCase().includes(q) ||
        (t.strategyName || '').toLowerCase().includes(q)
      )) return false;
      // Session filter
      if (filterSession !== 'Tous' && t.session !== filterSession) return false;
      // Strategie filter
      if (filterStrategie !== 'Tous') {
        const strat = t.strategyName || 'Discrétionnaire';
        if (strat !== filterStrategie) return false;
      }
      // Resultat filter
      if (filterResultat === 'Gain' && t.resultat <= 0) return false;
      if (filterResultat === 'Perte' && t.resultat >= 0) return false;
      // Actif filter
      if (filterActif !== 'Tous' && t.actif !== filterActif) return false;

      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case 'date':
          va = new Date(a.createdAt || '').getTime();
          vb = new Date(b.createdAt || '').getTime();
          break;
        case 'actif': va = a.actif; vb = b.actif; break;
        case 'pnl': va = a.resultat; vb = b.resultat; break;
        case 'lots': va = a.lots ?? 0; vb = b.lots ?? 0; break;
        case 'session': va = a.session ?? ''; vb = b.session ?? ''; break;
        case 'rr':
          va = getRealRR(a) ?? -999;
          vb = getRealRR(b) ?? -999;
          break;
        case 'strategie': va = a.strategyName ?? ''; vb = b.strategyName ?? ''; break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, searchQuery, selectedYear, selectedMonth, filterSession, filterStrategie, filterResultat, filterActif, sortKey, sortDir]);

  // Summary of filtered trades
  const filteredPnL = filteredAndSorted.reduce((s, t) => s + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
  const filteredWins = filteredAndSorted.filter(t => t.resultat > 0).length;
  const filteredWR = filteredAndSorted.length > 0 ? Math.round((filteredWins / filteredAndSorted.length) * 100) : 0;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} style={{ opacity: 0.3, marginLeft: '0.3rem' }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--gold-primary)', marginLeft: '0.3rem' }} />
      : <ChevronDown size={12} style={{ color: 'var(--gold-primary)', marginLeft: '0.3rem' }} />;
  };

  const thStyle = (k: SortKey): React.CSSProperties => ({
    padding: '0.9rem 0.75rem',
    color: sortKey === k ? 'var(--gold-primary)' : 'var(--gold-secondary)',
    textTransform: 'uppercase',
    fontSize: '0.7rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  });

  return (
    <div className="card trades-list-page" style={{ width: '100%' }}>
      {/* Lightbox */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Capture plein écran" className="lightbox-img" />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Historique Complet de Trading</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Filtrez, triez et analysez l'intégralité de vos opérations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }} className="search-input">
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', width: '220px', height: '38px', fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Export CSV */}
          <button
            onClick={() => exportToCSV(filteredAndSorted)}
            className="btn export-btn"
            style={{
              width: 'auto', padding: '0 1rem', height: '38px', fontSize: '0.82rem',
              background: 'rgba(197,160,89,0.08)', border: '1px solid var(--border-color)',
              color: 'var(--gold-primary)', transform: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
            title="Exporter en CSV (Excel compatible)"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar" style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
        padding: '0.9rem 1rem', background: 'rgba(8,9,13,0.3)', borderRadius: '12px',
        border: '1px solid var(--border-color)', marginBottom: '1.25rem'
      }}>
        <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Année */}
        <select
          className="input-field"
          style={{ width: 'auto', height: '34px', fontSize: '0.8rem', padding: '0 0.75rem' }}
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          <option value="Tous">Toutes années</option>
          {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Mois */}
        <select
          className="input-field"
          style={{ width: 'auto', height: '34px', fontSize: '0.8rem', padding: '0 0.75rem' }}
          value={selectedMonth === 'Tous' ? 'Tous' : String(selectedMonth)}
          onChange={e => setSelectedMonth(e.target.value === 'Tous' ? 'Tous' : parseInt(e.target.value))}
        >
          <option value="Tous">Tous mois</option>
          {MONTHS_FR.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>

        {/* Actif */}
        <select
          className="input-field"
          style={{ width: 'auto', height: '34px', fontSize: '0.8rem', padding: '0 0.75rem' }}
          value={filterActif}
          onChange={e => setFilterActif(e.target.value)}
        >
          {uniqueActifs.map(a => <option key={a} value={a}>{a === 'Tous' ? 'Tous actifs' : a}</option>)}
        </select>

        {/* Session */}
        <select
          className="input-field"
          style={{ width: 'auto', height: '34px', fontSize: '0.8rem', padding: '0 0.75rem' }}
          value={filterSession}
          onChange={e => setFilterSession(e.target.value)}
        >
          {uniqueSessions.map(s => <option key={s} value={s}>{s === 'Tous' ? 'Toutes sessions' : s}</option>)}
        </select>

        {/* Stratégie */}
        <select
          className="input-field"
          style={{ width: 'auto', height: '34px', fontSize: '0.8rem', padding: '0 0.75rem' }}
          value={filterStrategie}
          onChange={e => setFilterStrategie(e.target.value)}
        >
          {uniqueStrategies.map(s => <option key={s} value={s}>{s === 'Tous' ? 'Toutes stratégies' : s}</option>)}
        </select>

        {/* Résultat */}
        <div className="result-filters" style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          {(['Tous', 'Gain', 'Perte'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterResultat(v)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', border: '1px solid',
                background: filterResultat === v
                  ? v === 'Gain' ? 'rgba(0,230,118,0.15)' : v === 'Perte' ? 'rgba(255,23,68,0.15)' : 'rgba(197,160,89,0.15)'
                  : 'transparent',
                borderColor: filterResultat === v
                  ? v === 'Gain' ? 'var(--color-gain)' : v === 'Perte' ? 'var(--color-perte)' : 'var(--gold-secondary)'
                  : 'var(--border-color)',
                color: filterResultat === v
                  ? v === 'Gain' ? 'var(--color-gain)' : v === 'Perte' ? 'var(--color-perte)' : 'var(--gold-primary)'
                  : 'var(--text-secondary)',
              }}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="summary-strip" style={{
        display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center',
        padding: '0.6rem 1rem', background: 'rgba(197,160,89,0.03)',
        borderRadius: '10px', border: '1px solid rgba(197,160,89,0.08)',
        marginBottom: '1rem', fontSize: '0.82rem'
      }}>
        <span style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filteredAndSorted.length}</strong> trades
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: filteredPnL >= 0 ? 'var(--color-gain)' : 'var(--color-perte)' }}>
          {filteredPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <strong>{typeof filteredPnL === 'number' && filteredPnL >= 0 ? '+' : ''}{typeof filteredPnL === 'number' ? filteredPnL.toFixed(2) : '0.00'} $</strong>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: filteredWR >= 50 ? 'var(--color-gain)' : 'var(--color-perte)' }}>
          <Target size={14} />
          Win Rate : <strong>{filteredWR}%</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {filteredWins}W / {filteredAndSorted.length - filteredWins}L
        </span>
      </div>

      {/* Table - Desktop */}
      {filteredAndSorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={48} style={{ color: 'var(--gold-secondary)', opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>Aucun trade ne correspond</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Modifie tes filtres.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={thStyle('date')} onClick={() => handleSort('date')}>
                    Date <SortIcon k="date" />
                  </th>
                  <th style={thStyle('actif')} onClick={() => handleSort('actif')}>
                    Actif <SortIcon k="actif" />
                  </th>
                  <th style={{ padding: '0.9rem 0.75rem', color: 'var(--gold-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                    Type
                  </th>
                  <th style={{ padding: '0.9rem 0.75rem', color: 'var(--gold-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                    Entrée / Sortie
                  </th>
                  <th style={{ padding: '0.9rem 0.75rem', color: 'var(--gold-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                    SL / TP
                  </th>
                  <th style={thStyle('lots')} onClick={() => handleSort('lots')}>
                    Lots <SortIcon k="lots" />
                  </th>
                  <th style={thStyle('session')} onClick={() => handleSort('session')}>
                    Session <SortIcon k="session" />
                  </th>
                  <th style={thStyle('strategie')} onClick={() => handleSort('strategie')}>
                    Stratégie <SortIcon k="strategie" />
                  </th>
                  <th style={thStyle('rr')} onClick={() => handleSort('rr')}>
                    R:R <SortIcon k="rr" />
                  </th>
                  <th style={thStyle('pnl')} onClick={() => handleSort('pnl')}>
                    PnL $ <SortIcon k="pnl" />
                  </th>
                  <th style={{ padding: '0.9rem 0.75rem', color: 'var(--gold-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center' }}>
                    📷
                  </th>
                  <th style={{ padding: '0.9rem 0.75rem', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map(t => {
                  const isGain = t.resultat >= 0;
                  const rr = getRealRR(t);
                  const formattedDate = t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                    : '';
                  const discipline = t.strategyRulesTotalCount && t.strategyRulesTotalCount > 0
                    ? Math.round(((t.checkedRules?.length || 0) / t.strategyRulesTotalCount) * 100)
                    : null;
                  return (
                    <tr
                      key={t.id}
                      style={{ 
                        borderBottom: '1px solid rgba(197,160,89,0.04)', 
                        transition: 'background-color 0.15s',
                        cursor: onSelectTrade ? 'pointer' : 'default'
                      }}
                      onClick={() => onSelectTrade?.(t)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {formattedDate}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>{t.actif}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span className={`trade-badge-position ${t.position.toLowerCase()}`}>
                          {t.position}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {typeof t.prixEntree === 'number' ? t.prixEntree.toFixed(2) : '0.00'}
                        {t.prixSortie && (
                          <span style={{ color: 'var(--text-muted)' }}> → {typeof t.prixSortie === 'number' ? t.prixSortie.toFixed(2) : '0.00'}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--color-perte)' }}>{typeof t.stopLoss === 'number' ? t.stopLoss.toFixed(2) : '0.00'}</span>
                        <span style={{ color: 'var(--text-muted)' }}> / </span>
                        <span style={{ color: 'var(--color-gain)' }}>{typeof t.takeProfit === 'number' ? t.takeProfit.toFixed(2) : '0.00'}</span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {t.lots !== undefined && typeof t.lots === 'number' ? t.lots.toFixed(2) : <span style={{ opacity: 0.3 }}>—</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {t.session ? (
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                            background: SESSION_COLORS[t.session] ? `${SESSION_COLORS[t.session]}22` : 'rgba(197,160,89,0.1)',
                            color: SESSION_COLORS[t.session] || 'var(--gold-primary)',
                            border: `1px solid ${SESSION_COLORS[t.session] ? `${SESSION_COLORS[t.session]}55` : 'rgba(197,160,89,0.3)'}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {t.session}
                          </span>
                        ) : <span style={{ opacity: 0.3, fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {t.strategyName ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold-secondary)', fontWeight: 600 }}>
                              {t.strategyName}
                            </span>
                            {discipline !== null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '40px', height: '3px', background: 'rgba(197,160,89,0.15)', borderRadius: '2px' }}>
                                  <div style={{
                                    width: `${discipline}%`, height: '100%', borderRadius: '2px',
                                    background: discipline === 100 ? 'var(--color-gain)' : discipline >= 50 ? '#ffa751' : 'var(--color-perte)'
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{discipline}%</span>
                              </div>
                            )}
                          </div>
                        ) : <span style={{ fontSize: '0.78rem', opacity: 0.35 }}>Discrétion.</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {rr !== null ? (
                          <span style={{
                            fontWeight: 700, fontFamily: 'monospace',
                            color: rr >= 1 ? 'var(--color-gain)' : rr >= 0 ? '#ffa751' : 'var(--color-perte)'
                          }}>
                            {typeof rr === 'number' ? rr.toFixed(2) : '0.00'}R
                          </span>
                        ) : <span style={{ opacity: 0.3, fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: isGain ? 'var(--color-gain)' : 'var(--color-perte)' }}>
                        {isGain ? `+${typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00'}` : `${typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00'}`} $
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                        {t.imageBase64 ? (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedImage(t.imageBase64!); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer' }}
                          >
                            <ImageIcon size={16} />
                          </button>
                        ) : <span style={{ opacity: 0.25 }}>—</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="edit-btn" onClick={e => { e.stopPropagation(); onEditTrade(t); }} style={{ padding: '0.3rem' }}>
                            <Pencil size={13} />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={e => { e.stopPropagation(); if (confirm('Supprimer ce trade ?')) onDeleteTrade(t.id!); }}
                            style={{ padding: '0.3rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-trades-container">
            {filteredAndSorted.map(t => {
              const isGain = t.resultat >= 0;
              const rr = getRealRR(t);
              const formattedDate = t.createdAt
                ? new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                : '';
              const discipline = t.strategyRulesTotalCount && t.strategyRulesTotalCount > 0
                ? Math.round(((t.checkedRules?.length || 0) / t.strategyRulesTotalCount) * 100)
                : null;
              return (
                <div key={t.id} className="mobile-trade-card" onClick={() => onSelectTrade?.(t)}>
                  <div className="mobile-trade-card-header">
                    <span className="mobile-trade-actif">{t.actif}</span>
                    <span className="mobile-trade-date">{formattedDate}</span>
                  </div>
                  
                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Type</span>
                    <span className="mobile-trade-value">
                      <span className={`trade-badge-position ${t.position.toLowerCase()}`}>
                        {t.position}
                      </span>
                    </span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Entrée</span>
                    <span className="mobile-trade-value">{typeof t.prixEntree === 'number' ? t.prixEntree.toFixed(2) : '0.00'}</span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Sortie</span>
                    <span className="mobile-trade-value">{t.prixSortie && typeof t.prixSortie === 'number' ? t.prixSortie.toFixed(2) : '—'}</span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">SL / TP</span>
                    <span className="mobile-trade-value">
                      <span style={{ color: 'var(--color-perte)' }}>{typeof t.stopLoss === 'number' ? t.stopLoss.toFixed(2) : '0.00'}</span>
                      <span style={{ color: 'var(--text-muted)' }}> / </span>
                      <span style={{ color: 'var(--color-gain)' }}>{typeof t.takeProfit === 'number' ? t.takeProfit.toFixed(2) : '0.00'}</span>
                    </span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Lots</span>
                    <span className="mobile-trade-value">{t.lots !== undefined && typeof t.lots === 'number' ? t.lots.toFixed(2) : '—'}</span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Session</span>
                    <span className="mobile-trade-value">
                      {t.session ? (
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: SESSION_COLORS[t.session] ? `${SESSION_COLORS[t.session]}22` : 'rgba(197,160,89,0.1)',
                          color: SESSION_COLORS[t.session] || 'var(--gold-primary)',
                          border: `1px solid ${SESSION_COLORS[t.session] ? `${SESSION_COLORS[t.session]}55` : 'rgba(197,160,89,0.3)'}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {t.session}
                        </span>
                      ) : '—'}
                    </span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">Stratégie</span>
                    <span className="mobile-trade-value">
                      {t.strategyName || 'Discrétion.'}
                      {discipline !== null && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                          ({discipline}%)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">R:R</span>
                    <span className="mobile-trade-value">
                      {rr !== null ? (
                        <span style={{
                          fontWeight: 700, fontFamily: 'monospace',
                          color: typeof rr === 'number' && rr >= 1 ? 'var(--color-gain)' : typeof rr === 'number' && rr >= 0 ? '#ffa751' : 'var(--color-perte)'
                        }}>
                          {typeof rr === 'number' ? rr.toFixed(2) : '0.00'}R
                        </span>
                      ) : '—'}
                    </span>
                  </div>

                  <div className="mobile-trade-row">
                    <span className="mobile-trade-label">PnL</span>
                    <span className={`mobile-trade-pnl ${isGain ? 'gain' : 'loss'}`}>
                      {isGain ? `+${typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00'}` : `${typeof t.resultat === 'number' ? t.resultat.toFixed(2) : '0.00'}`} $
                    </span>
                  </div>

                  <div className="mobile-trade-actions">
                    {t.imageBase64 && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedImage(t.imageBase64!); }}
                        style={{
                          background: 'rgba(197,160,89,0.1)', border: '1px solid var(--border-color)',
                          color: 'var(--gold-primary)', borderRadius: '8px', padding: '0.5rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                        }}
                      >
                        <ImageIcon size={14} />
                        Image
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); onEditTrade(t); }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-color)',
                        color: '#59a5ff', borderRadius: '8px', padding: '0.5rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                      }}
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Supprimer ce trade ?')) onDeleteTrade(t.id!); }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--border-color)',
                        color: '#ef4444', borderRadius: '8px', padding: '0.5rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                      }}
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
