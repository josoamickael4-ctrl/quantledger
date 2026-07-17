import React, { useState } from 'react';
import { BrainCircuit, Trash2, Compass, Award, Pencil } from 'lucide-react';

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



interface CoachingPanelProps {
  trade: Trade | null;
  onDeleteTrade: (id: string) => Promise<void>;
  onEditTrade: (trade: Trade) => void;
}

export const CoachingPanel: React.FC<CoachingPanelProps> = ({ trade, onDeleteTrade, onEditTrade }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!trade) {
    return (
      <div className="card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <BrainCircuit size={60} />
          <div className="empty-state-title">Aucun trade sélectionné</div>
          <div className="empty-state-subtitle">
            Sélectionne un trade dans la liste ou ajoutes-en un pour démarrer le coaching de l'expert XAU/USD.
          </div>
        </div>
      </div>
    );
  }

  const parseAnalysis = (text?: string) => {
    if (!text) return null;
    const rows: { aspect: string; content: string }[] = [];
    let advice = '';
    const lines = text.split('\n');
    let readingAdvice = false;

    for (const line of lines) {
      if (line.includes('Conseil du Mentor') || line.includes('💡')) {
        readingAdvice = true;
        continue;
      }
      if (readingAdvice) { advice += line + '\n'; continue; }
      if (line.trim().startsWith('|') && !line.includes('Aspect') && !line.includes(':---')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
        if (parts.length >= 2) rows.push({ aspect: parts[0].replace(/\*\*/g, '').trim(), content: parts[1].trim() });
      }
    }
    return { hasTable: rows.length > 0, rows, advice: advice.trim(), fullText: text };
  };

  const analysis = parseAnalysis(trade.analyseMentor);
  const isGain = trade.resultat >= 0;
  const formattedDate = trade.createdAt
    ? new Date(trade.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && trade.imageBase64 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <img src={trade.imageBase64} alt="Graphique plein écran" className="lightbox-img" />
        </div>
      )}

      <div className="card coaching-panel">
        <div className="coaching-header">
          <div>
            <h2 className="coaching-title">{trade.actif}</h2>
            <div className="coaching-sub" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <span>Le {formattedDate} • Position {trade.position}</span>
              {trade.strategyName && (
                <span style={{
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  background: 'rgba(197, 160, 89, 0.12)',
                  color: 'var(--gold-primary)',
                  border: '1px solid rgba(197, 160, 89, 0.25)'
                }}>
                  Setup: {trade.strategyName}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="edit-btn" onClick={() => onEditTrade(trade)} title="Modifier le trade">
              <Pencil size={16} />
            </button>
            <button
              className="delete-btn"
              onClick={() => { if (confirm('Es-tu sûr de vouloir supprimer cette entrée ?')) onDeleteTrade(trade.id || ''); }}
              title="Supprimer le trade"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="details-row">
          <div className="details-item">
            <span className="details-label">Position</span>
            <span className="details-value" style={{ color: trade.position === 'Achat' ? 'var(--color-gain)' : 'var(--color-perte)' }}>
              {trade.position === 'Achat' ? 'LONG (Achat)' : 'SHORT (Vente)'}
            </span>
          </div>
          <div className="details-item">
            <span className="details-label">Entrée</span>
            <span className="details-value">{typeof trade.prixEntree === 'number' ? trade.prixEntree.toFixed(2) : '0.00'}</span>
          </div>
          <div className="details-item">
            <span className="details-label">SL / TP</span>
            <span className="details-value" style={{ fontSize: '0.9rem' }}>{typeof trade.stopLoss === 'number' ? trade.stopLoss.toFixed(2) : '0.00'} / {typeof trade.takeProfit === 'number' ? trade.takeProfit.toFixed(2) : '0.00'}</span>
          </div>
          <div className="details-item">
            <span className="details-label">Résultat</span>
            <span className={`details-value ${isGain ? 'gain' : 'perte'}`} style={{ color: isGain ? 'var(--color-gain)' : 'var(--color-perte)' }}>
              {isGain ? `+${typeof trade.resultat === 'number' ? trade.resultat.toFixed(2) : '0.00'}` : `${typeof trade.resultat === 'number' ? trade.resultat.toFixed(2) : '0.00'}`} $
            </span>
          </div>
        </div>

        {/* Execution Metrics + R:R */}
        {(trade.lots || trade.session || trade.timeframe || trade.prixSortie) && (() => {
          // R:R théorique (TP/SL)
          const slDist = Math.abs(trade.prixEntree - trade.stopLoss);
          const tpDist = Math.abs(trade.takeProfit - trade.prixEntree);
          const rrTheo = slDist > 0 ? (tpDist / slDist) : null;

          // R:R réel obtenu (prixSortie vs SL)
          let rrReal: number | null = null;
          if (trade.prixSortie && slDist > 0) {
            const realDist = trade.position === 'Achat'
              ? trade.prixSortie - trade.prixEntree
              : trade.prixEntree - trade.prixSortie;
            rrReal = realDist / slDist;
          }

          return (
            <div style={{
              background: 'rgba(8,9,13,0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.9rem 1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem'
            }}>
              {trade.lots && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Volume</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.lots} lot{trade.lots > 1 ? 's' : ''}</div>
                </div>
              )}
              {trade.session && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Session</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-secondary)' }}>{trade.session}</div>
                </div>
              )}
              {trade.timeframe && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Timeframe</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.timeframe}</div>
                </div>
              )}
              {trade.prixSortie && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>Prix Sortie</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{typeof trade.prixSortie === 'number' ? trade.prixSortie.toFixed(2) : '0.00'}</div>
                </div>
              )}
              {rrTheo !== null && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>R:R Cible</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-primary)' }}>1 : {typeof rrTheo === 'number' ? rrTheo.toFixed(2) : '0.00'}</div>
                </div>
              )}
              {rrReal !== null && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>R:R Obtenu</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: typeof rrReal === 'number' && rrReal >= 1 ? 'var(--color-gain)' : typeof rrReal === 'number' && rrReal >= 0 ? '#ffa751' : 'var(--color-perte)' }}>
                    1 : {typeof rrReal === 'number' ? rrReal.toFixed(2) : '0.00'}
                    {rrTheo !== null && (
                      <span style={{ fontSize: '0.72rem', marginLeft: '0.4rem', opacity: 0.7 }}>
                        ({rrReal >= rrTheo ? '↑ Objectif atteint' : '↓ Objectif manqué'})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Strategy checklist audit */}
        {trade.strategyName && (
          <div style={{
            background: 'rgba(8, 9, 13, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Discipline de Validation du Setup
              </span>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 'bold',
                color: (trade.checkedRules?.length || 0) === (trade.strategyRulesTotalCount || 0) && (trade.strategyRulesTotalCount || 0) > 0
                  ? 'var(--color-gain)'
                  : (trade.checkedRules?.length || 0) === 0
                    ? 'var(--color-perte)'
                    : '#ffa751'
              }}>
                {(trade.checkedRules?.length || 0)} / {(trade.strategyRulesTotalCount || 0)} Règles Validées
              </span>
            </div>

            {trade.checkedRules && trade.checkedRules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {trade.checkedRules.map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--color-gain)', fontWeight: 'bold' }}>✓</span>
                    <span style={{ lineHeight: '1.4' }}>{rule}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-perte)', fontStyle: 'italic' }}>
                Aucune règle n'a été respectée lors de l'entrée en position.
              </div>
            )}
          </div>
        )}

        {/* Screenshot image */}
        {trade.imageBase64 && (
          <div>
            <div className="form-label" style={{ marginBottom: '0.5rem' }}>Capture d'écran du graphique</div>
            <div className="image-preview-container">
              <img
                src={trade.imageBase64}
                alt="Graphique"
                className="image-preview"
                onClick={() => setLightboxOpen(true)}
                title="Cliquer pour agrandir"
              />
            </div>
          </div>
        )}

        {/* Context and emotion */}
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(8,9,13,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div className="form-label" style={{ marginBottom: '0.4rem' }}>Contexte & Déclencheur</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{trade.contexte}</p>
          </div>
          <div style={{ background: 'rgba(8,9,13,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div className="form-label" style={{ marginBottom: '0.4rem' }}>État Émotionnel Déclaré</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--gold-secondary)', fontWeight: 600 }}>{trade.emotion}</p>
          </div>
        </div>


        {/* Mentor Analysis */}
        <div className="analysis-container">
          <div className="analysis-header">
            <BrainCircuit size={20} />
            <span>Audit & Mentorat XAU/USD</span>
          </div>
          <div className="analysis-content">
            {analysis ? (
              <>
                {analysis.hasTable ? (
                  <table>
                    <thead>
                      <tr><th>Aspect Analysé</th><th>Évaluation de l'Expert</th></tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                              {row.aspect.toLowerCase().includes('technique') ? <Compass size={14} style={{ color: 'var(--gold-secondary)' }} /> : <BrainCircuit size={14} style={{ color: 'var(--gold-secondary)' }} />}
                              {row.aspect}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: row.content.includes('🟢') ? 'var(--color-gain)' : row.content.includes('🔴') || row.content.includes('⚠️') ? 'var(--color-perte)' : 'inherit' }}>
                              {row.content}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{analysis.fullText}</div>
                )}
                {analysis.advice && (
                  <div className="mentor-advice-box">
                    <h3 style={{ margin: '0 0 0.75rem', fontFamily: 'Outfit', fontSize: '1.15rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={18} /> Conseil du Mentor XAU/USD
                    </h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{analysis.advice}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune analyse disponible.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
