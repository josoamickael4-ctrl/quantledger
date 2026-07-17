import React, { useState, useEffect } from 'react';
import { Pencil, X, ImageIcon, XCircle } from 'lucide-react';

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
  strategyId?: string;
  strategyName?: string;
  checkedRules?: string[];
  strategyRulesTotalCount?: number;
  lots?: number;
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | null;
  prixSortie?: number;
}




interface Strategy {
  id?: string;
  name: string;
  actif: string;
  rules: string[];
  riskPercent: number;
  targetRR: number;
  description?: string;
  createdAt?: string;
}

interface EditTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Trade>) => Promise<void>;
  strategies: Strategy[];
}

export const EditTradeModal: React.FC<EditTradeModalProps> = ({ trade, onClose, onSave, strategies }) => {
  const [actif, setActif] = useState(trade.actif);
  const [position, setPosition] = useState<'Achat' | 'Vente'>(trade.position);
  const [prixEntree, setPrixEntree] = useState(String(trade.prixEntree));
  const [stopLoss, setStopLoss] = useState(String(trade.stopLoss));
  const [takeProfit, setTakeProfit] = useState(String(trade.takeProfit));
  const [resultat, setResultat] = useState(String(trade.resultat));
  const [contexte, setContexte] = useState(trade.contexte);
  const [emotion, setEmotion] = useState(trade.emotion);
  const [imageBase64, setImageBase64] = useState(trade.imageBase64 || '');
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => {
    if (trade.createdAt) {
      const d = new Date(trade.createdAt);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    }
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
  });

  // Execution metrics
  const [lots, setLots] = useState(trade.lots !== undefined ? String(trade.lots) : '');
  const [session, setSession] = useState<'Asie' | 'Londres' | 'New York' | 'Overlap' | ''>(trade.session || '');
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | ''>(trade.timeframe || '');
  const [prixSortie, setPrixSortie] = useState(trade.prixSortie !== undefined ? String(trade.prixSortie) : '');

  // Auto-calculate PnL when lots/prixSortie/position/actif change
  useEffect(() => {
    const lotsNum = parseFloat(lots);
    const entree = parseFloat(prixEntree);
    const sortie = parseFloat(prixSortie);
    if (!isNaN(lotsNum) && lotsNum > 0 && !isNaN(entree) && !isNaN(sortie)) {
      let pnl = 0;
      const a = actif.toUpperCase();
      if (a.includes('XAU')) {
        pnl = position === 'Achat' ? lotsNum * (sortie - entree) * 100 : lotsNum * (entree - sortie) * 100;
      } else if (a.includes('EUR') || a.includes('GBP') || a.includes('USD')) {
        pnl = position === 'Achat' ? lotsNum * (sortie - entree) * 100000 : lotsNum * (entree - sortie) * 100000;
      } else {
        pnl = position === 'Achat' ? lotsNum * (sortie - entree) : lotsNum * (entree - sortie);
      }
      setResultat(pnl.toFixed(2));
    }
  }, [lots, prixSortie, position, actif, prixEntree]);

  // Strategy edit state
  const [strategyId, setStrategyId] = useState(trade.strategyId || '');
  const [checkedRules, setCheckedRules] = useState<{ [key: string]: boolean }>(() => {
    const checkedMap: { [key: string]: boolean } = {};
    if (trade.checkedRules) {
      trade.checkedRules.forEach(rule => {
        checkedMap[rule] = true;
      });
    }
    return checkedMap;
  });

  const activeStrategy = strategies.find(s => s.id === strategyId);

  // Adjust asset if strategy changes
  useEffect(() => {
    const strat = strategies.find(s => s.id === strategyId);
    if (strat) {
      setActif(strat.actif);
    }
  }, [strategyId, strategies]);


  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 MB). Compresse-la avant de la télécharger.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const activeStrat = strategies.find(s => s.id === strategyId);
      const checkedRuleTexts = activeStrat
        ? activeStrat.rules.filter(rule => !!checkedRules[rule])
        : [];

      await onSave(trade.id!, {
        actif,
        position,
        prixEntree: parseFloat(prixEntree),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        resultat: parseFloat(resultat),
        contexte,
        emotion,
        imageBase64: imageBase64 || undefined,
        strategyId: strategyId || undefined,
        strategyName: activeStrat ? activeStrat.name : undefined,
        checkedRules: activeStrat ? checkedRuleTexts : undefined,
        strategyRulesTotalCount: activeStrat ? activeStrat.rules.length : undefined,
        lots: lots ? parseFloat(lots) : undefined,
        session: session || null,
        timeframe: timeframe || null,
        prixSortie: prixSortie ? parseFloat(prixSortie) : undefined,
        createdAt: new Date(createdAt).toISOString(),
      });
      onClose();
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title">
            <Pencil size={18} />
            Modifier le Trade
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Date et Heure du Trade */}
            <div className="form-group">
              <label className="form-label">Date et Heure du Trade</label>
              <input
                type="datetime-local"
                className="input-field"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                required
              />
            </div>

            {/* Sélection de Stratégie */}
            <div className="form-group">
              <label className="form-label">Stratégie / Setup</label>
              <select
                className="input-field"
                value={strategyId}
                onChange={e => setStrategyId(e.target.value)}
              >
                <option value="">Aucun setup (Discrétionnaire)</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.actif})</option>
                ))}
              </select>
            </div>

            {/* Checklist interactive en édition */}
            {activeStrategy && activeStrategy.rules.length > 0 && (
              <div className="form-group" style={{
                background: 'rgba(255, 215, 0, 0.01)',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '0.85rem',
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Règles validées pour ce trade :
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {activeStrategy.rules.map((rule, idx) => (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedRules[rule]}
                        onChange={() => {
                          setCheckedRules(prev => ({
                            ...prev,
                            [rule]: !prev[rule]
                          }));
                        }}
                        style={{ marginTop: '0.15rem' }}
                      />
                      <span>{rule}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Actif</label>
                <select className="input-field" value={actif} onChange={e => setActif(e.target.value)}>
                  <option value="XAU/USD">Gold (XAU/USD)</option>
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="GBP/USD">GBP/USD</option>
                  <option value="BTC/USD">Bitcoin (BTC/USD)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Position</label>
                <select className="input-field" value={position} onChange={e => setPosition(e.target.value as any)}>
                  <option value="Achat">Achat (Long)</option>
                  <option value="Vente">Vente (Short)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Prix d'Entrée</label>
              <input type="number" step="any" required className="input-field" value={prixEntree} onChange={e => setPrixEntree(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Stop Loss</label>
                <input type="number" step="any" required className="input-field" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Take Profit</label>
                <input type="number" step="any" required className="input-field" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
              </div>
            </div>

            {/* Execution: Lots + Session */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Volume (Lots)</label>
                <input
                  type="number" step="0.01" min="0.01" className="input-field"
                  placeholder="ex: 0.10"
                  value={lots}
                  onChange={e => setLots(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Session</label>
                <select className="input-field" value={session} onChange={e => setSession(e.target.value as any)}>
                  <option value="">— Choisir —</option>
                  <option value="Asie">🌏 Asie</option>
                  <option value="Londres">🇬🇧 Londres</option>
                  <option value="New York">🗽 New York</option>
                  <option value="Overlap">⚡ Overlap Lon/NY</option>
                </select>
              </div>
            </div>

            {/* Timeframe + Prix Sortie */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Timeframe</label>
                <select className="input-field" value={timeframe} onChange={e => setTimeframe(e.target.value as any)}>
                  <option value="">— Choisir —</option>
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prix de Sortie</label>
                <input
                  type="number" step="any" className="input-field"
                  placeholder="Prix clôture"
                  value={prixSortie}
                  onChange={e => setPrixSortie(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Résultat (USD) <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)' }}>— Auto-calculé, ajustable</span></label>
              <input type="number" step="any" required className="input-field" value={resultat} onChange={e => setResultat(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">État émotionnel</label>
              <select className="input-field" value={emotion} onChange={e => setEmotion(e.target.value)}>
                <option value="Calme / Serein">Calme / Serein (Discipline)</option>
                <option value="Impatient / Pressé">Impatient / Pressé d'entrer</option>
                <option value="FOMO / Peur de rater le mouvement">FOMO / Peur de rater le mouvement</option>
                <option value="Stressé / Tendu">Stressé / Tendu</option>
                <option value="Frustré / Revenge trading">Frustré / Revenge trading</option>
                <option value="Excès de confiance / Euphorique">Excès de confiance / Euphorique</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contexte & Raison</label>
              <textarea required rows={3} className="input-field" value={contexte} onChange={e => setContexte(e.target.value)} />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Capture d'écran du graphique</label>
              {imageBase64 ? (
                <div className="image-preview-container">
                  <img src={imageBase64} alt="Graphique trade" className="image-preview" />
                  <button type="button" className="image-remove-btn" onClick={() => setImageBase64('')}>
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="image-upload-area">
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  <div className="image-upload-label">
                    <ImageIcon size={28} />
                    <span>Glisser une image ou cliquer pour télécharger</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>PNG, JPG (max 5 MB)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Sauvegarde...</> : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
