import React, { useState, useEffect } from 'react';
import { PlusCircle, ImageIcon, XCircle, AlertTriangle } from 'lucide-react';

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

interface TradeFormProps {
  onAddTrade: (trade: any) => Promise<void>;
  strategies: Strategy[];
}

export const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, strategies }) => {
  const [actif, setActif] = useState('XAU/USD');
  const [customActif, setCustomActif] = useState('');
  const [isCustomActif, setIsCustomActif] = useState(false);
  const [position, setPosition] = useState<'Achat' | 'Vente'>('Achat');
  const [prixEntree, setPrixEntree] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [resultat, setResultat] = useState('');
  const [contexte, setContexte] = useState('');
  const [emotion, setEmotion] = useState('Calme / Serein');
  const [imageBase64, setImageBase64] = useState('');
  const [rrRatio, setRrRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => {
    const localDate = new Date();
    const tzOffset = localDate.getTimezoneOffset() * 60000;
    return (new Date(localDate.getTime() - tzOffset)).toISOString().slice(0, 16);
  });

  // Strategy checklist state
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [checkedRules, setCheckedRules] = useState<{ [key: number]: boolean }>({});

  // Execution metrics state
  const [lots, setLots] = useState('0.10');
  const [session, setSession] = useState<'Asie' | 'Londres' | 'New York' | 'Overlap' | ''>('');
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | ''>('M15');
  const [prixSortie, setPrixSortie] = useState('');

  // Available assets
  const [availableAssets, setAvailableAssets] = useState<string[]>(() => {
    const saved = localStorage.getItem('xau_custom_assets');
    const customAssets = saved ? JSON.parse(saved) : [];
    return ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', ...customAssets];
  });



  useEffect(() => {
    const entry = parseFloat(prixEntree);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    if (entry > 0 && sl > 0 && tp > 0) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      if (risk > 0) setRrRatio(Number((reward / risk).toFixed(2)));
      else setRrRatio(null);
    } else {
      setRrRatio(null);
    }
  }, [prixEntree, stopLoss, takeProfit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Reset checked rules when strategy changes
  useEffect(() => {
    setCheckedRules({});
    const strat = strategies.find(s => s.id === selectedStrategyId);
    if (strat) {
      setActif(strat.actif);
    }
  }, [selectedStrategyId, strategies]);

  const activeStrategy = strategies.find(s => s.id === selectedStrategyId);
  const totalRulesCount = activeStrategy ? activeStrategy.rules.length : 0;
  const checkedRulesCount = activeStrategy
    ? activeStrategy.rules.filter((_, idx) => checkedRules[idx]).length
    : 0;
  const isChecklistComplete = totalRulesCount === 0 || checkedRulesCount === totalRulesCount;
  const checkedPercentage = totalRulesCount > 0 ? (checkedRulesCount / totalRulesCount) * 100 : 0;

  const handleCheckRule = (idx: number) => {
    setCheckedRules(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Auto-calculate PnL
  useEffect(() => {
    const entry = parseFloat(prixEntree);
    const exit = parseFloat(prixSortie);
    const volume = parseFloat(lots);

    if (!isNaN(entry) && !isNaN(exit) && !isNaN(volume) && volume > 0) {
      let pnl = 0;
      const isAchat = position === 'Achat';

      if (actif === 'XAU/USD') {
        pnl = volume * (exit - entry) * 100 * (isAchat ? 1 : -1);
      } else if (actif === 'EUR/USD' || actif === 'GBP/USD') {
        pnl = volume * (exit - entry) * 100000 * (isAchat ? 1 : -1);
      } else {
        pnl = volume * (exit - entry) * 1 * (isAchat ? 1 : -1);
      }

      setResultat(pnl.toFixed(2));
    }
  }, [prixEntree, prixSortie, lots, actif, position]);

  const handleAddCustomAsset = () => {
    if (customActif.trim() && !availableAssets.includes(customActif.trim())) {
      const newAssets = [...availableAssets, customActif.trim()];
      setAvailableAssets(newAssets);
      localStorage.setItem('xau_custom_assets', JSON.stringify(newAssets.filter(a => !['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD'].includes(a))));
      setActif(customActif.trim());
      setCustomActif('');
      setIsCustomActif(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prixEntree || !prixSortie || !stopLoss || !takeProfit || resultat === '' || !contexte || !lots) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const activeStrat = strategies.find(s => s.id === selectedStrategyId);
      const checkedRuleTexts = activeStrat
        ? activeStrat.rules.filter((_, idx) => !!checkedRules[idx])
        : [];

      await onAddTrade({
        actif,
        position,
        prixEntree: parseFloat(prixEntree),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        resultat: parseFloat(resultat),
        contexte,
        emotion,
        imageBase64: imageBase64 || undefined,
        strategyId: selectedStrategyId || undefined,
        strategyName: activeStrat ? activeStrat.name : undefined,
        checkedRules: activeStrat ? checkedRuleTexts : undefined,
        strategyRulesTotalCount: activeStrat ? activeStrat.rules.length : undefined,
        lots: parseFloat(lots),
        session: session || undefined,
        timeframe: timeframe || undefined,
        prixSortie: parseFloat(prixSortie),
        createdAt: new Date(createdAt).toISOString(),
      });

      setPrixEntree('');
      setPrixSortie('');
      setStopLoss('');
      setTakeProfit('');
      setResultat('');
      setContexte('');
      setEmotion('Calme / Serein');
      setImageBase64('');
      setSelectedStrategyId('');
      setCheckedRules({});
      setLots('0.10');
      setSession('');
      const localDate = new Date();
      const tzOffset = localDate.getTimezoneOffset() * 60000;
      setCreatedAt((new Date(localDate.getTime() - tzOffset)).toISOString().slice(0, 16));
    } catch (err) {
      alert("Erreur lors de l'enregistrement du trade.");
    } finally {
      setLoading(false);
    }
  };

  const getRrClass = (r: number) => r >= 2 ? 'good' : r >= 1.5 ? '' : 'bad';
  const getRrLabel = (r: number) => r >= 2 ? 'Excellent (≥ 2:1)' : r >= 1.5 ? 'Moyen (≥ 1.5:1)' : '⚠️ Risque Élevé (< 1.5:1)';



  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="card-title">
        <PlusCircle size={20} />
        Journaliser un Trade
      </h3>

      {/* Sélection de Stratégie */}
      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label className="form-label">Stratégie / Setup utilisé</label>
        <select
          className="input-field"
          value={selectedStrategyId}
          onChange={e => setSelectedStrategyId(e.target.value)}
        >
          <option value="">Aucun setup (Trading discrétionnaire)</option>
          {strategies.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.actif})</option>
          ))}
        </select>
      </div>

      {/* Date et Heure du Trade */}
      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label className="form-label">Date et Heure du Trade</label>
        <input
          type="datetime-local"
          className="input-field"
          value={createdAt}
          onChange={e => setCreatedAt(e.target.value)}
          required
        />
      </div>

      {/* Checklist interactive */}
      {activeStrategy && totalRulesCount > 0 && (
        <div className="strategy-checklist-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Checklist : {activeStrategy.name}
            </span>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isChecklistComplete ? 'var(--color-gain)' : 'var(--gold-primary)'
            }}>
              {checkedRulesCount} / {totalRulesCount} ({Math.round(checkedPercentage)}%)
            </span>
          </div>

          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${checkedPercentage}%`,
              height: '100%',
              background: isChecklistComplete ? 'var(--color-gain)' : 'var(--gold-gradient)',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            {activeStrategy.rules.map((rule, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: checkedRules[idx] ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedRules[idx]}
                  onChange={() => handleCheckRule(idx)}
                  style={{
                    marginTop: '0.15rem',
                    accentColor: 'var(--gold-primary)',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  textDecoration: checkedRules[idx] ? 'line-through' : 'none',
                  opacity: checkedRules[idx] ? 0.65 : 1,
                  lineHeight: '1.3'
                }}>
                  {rule}
                </span>
              </label>
            ))}
          </div>

          {!isChecklistComplete && (
            <div style={{
              background: 'rgba(255, 167, 81, 0.05)',
              border: '1px solid rgba(255, 167, 81, 0.15)',
              borderRadius: '8px',
              padding: '0.6rem 0.8rem',
              color: '#ffa751',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.25rem'
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Avertissement :</strong> Entrer sans valider toutes vos règles est une infraction à votre plan de trading.</span>
            </div>
          )}
        </div>
      )}

      <div className="form-row">

        <div className="form-group">
          <label className="form-label">Actif</label>
          {isCustomActif ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                value={customActif}
                onChange={e => setCustomActif(e.target.value)}
                placeholder="Ex: EUR/GBP"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddCustomAsset}
                style={{
                  padding: '0 1rem',
                  background: 'var(--gold-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => { setIsCustomActif(false); setCustomActif(''); }}
                style={{
                  padding: '0 0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="input-field" value={actif} onChange={e => setActif(e.target.value)} style={{ flex: 1 }}>
                {availableAssets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCustomActif(true)}
                style={{
                  padding: '0 0.75rem',
                  background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '8px',
                  color: '#ffd700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Ajouter un nouvel actif"
              >
                + Nouveau
              </button>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Position</label>
          <select className="input-field" value={position} onChange={e => setPosition(e.target.value as any)}>
            <option value="Achat">Achat (Long)</option>
            <option value="Vente">Vente (Short)</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Prix d'Entrée</label>
          <input type="number" step="any" className="input-field" value={prixEntree} onChange={e => setPrixEntree(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Prix de Sortie</label>
          <input type="number" step="any" className="input-field" value={prixSortie} onChange={e => setPrixSortie(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Stop Loss</label>
          <input type="number" step="any" className="input-field" value={stopLoss} onChange={e => setStopLoss(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Take Profit</label>
          <input type="number" step="any" className="input-field" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Volume (Lots)</label>
          <input type="number" step="0.01" min="0.01" className="input-field" value={lots} onChange={e => setLots(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Session</label>
          <select className="input-field" value={session} onChange={e => setSession(e.target.value as any)}>
            <option value="">— Facultatif —</option>
            <option value="Asie">Asie (Tokyo/Sydney)</option>
            <option value="Londres">Londres (Europe Open)</option>
            <option value="New York">New York (US Open)</option>
            <option value="Overlap">Overlap (LDN/NY Open)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Timeframe</label>
          <select className="input-field" value={timeframe} onChange={e => setTimeframe(e.target.value as any)}>
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>
        </div>
      </div>


      {rrRatio !== null && (
        <div className="rr-calculator">
          <div>
            <span className="rr-calc-title">Ratio R:R Théorique</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRrLabel(rrRatio)}</div>
          </div>
          <div className={`rr-calc-val ${getRrClass(rrRatio)}`}>{rrRatio}:1</div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Résultat (USD)</label>
        <input type="number" step="any" className="input-field" value={resultat} onChange={e => setResultat(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">État émotionnel (optionnel)</label>
        <select className="input-field" value={emotion} onChange={e => setEmotion(e.target.value)}>
          <option value="">— Non spécifié —</option>
          <option value="Calme / Serein">Calme / Serein (Discipline)</option>
          <option value="Impatient / Pressé">Impatient / Pressé d'entrer</option>
          <option value="FOMO / Peur de rater le mouvement">FOMO / Peur de rater le mouvement</option>
          <option value="Stressé / Tendu">Stressé / Tendu</option>
          <option value="Frustré / Revenge trading">Frustré / Revenge trading</option>
          <option value="Excès de confiance / Euphorique">Excès de confiance / Euphorique</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Contexte & Raison du Trade</label>
        <textarea className="input-field" value={contexte} onChange={e => setContexte(e.target.value)} />
      </div>

      {/* Image upload */}
      <div className="form-group">
        <label className="form-label">Capture d'écran (optionnel)</label>
        {imageBase64 ? (
          <div className="image-preview-container">
            <img src={imageBase64} alt="Aperçu graphique" className="image-preview" />
            <button type="button" className="image-remove-btn" onClick={() => setImageBase64('')}>
              <XCircle size={16} />
            </button>
          </div>
        ) : (
          <div className="image-upload-area">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <div className="image-upload-label">
              <ImageIcon size={26} />
              <span>Glisser une image ou cliquer pour choisir</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>PNG, JPG — max 5 MB</span>
            </div>
          </div>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn">
        {loading ? (
          <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Analyse en cours...</>
        ) : (
          'Analyser & Enregistrer'
        )}
      </button>
    </form>
  );
};
