import React, { useState } from 'react';
import { Compass, CheckSquare, PlusCircle, Trash2, Award, FileText, Check } from 'lucide-react';
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

interface StrategyPageProps {
  strategies: Strategy[];
  onAddStrategy: (strategy: Omit<Strategy, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteStrategy: (id: string) => Promise<void>;
  loading: boolean;
}

export const StrategyPage: React.FC<StrategyPageProps> = ({
  strategies,
  onAddStrategy,
  onDeleteStrategy,
  loading,
}) => {
  const [name, setName] = useState('');
  const [actif, setActif] = useState('XAU/USD');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [targetRR, setTargetRR] = useState('2.5');
  const [rulesText, setRulesText] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Pre-trade checklist state
  const [selectedChecklistStratId, setSelectedChecklistStratId] = useState<string>('');
  const [checkedRules, setCheckedRules] = useState<{ [key: string]: boolean }>({});

  const activeChecklistStrat = strategies.find(s => s.id === selectedChecklistStratId) || strategies[0];

  // Initialize selected checklist strategy once strategies are loaded
  React.useEffect(() => {
    if (strategies.length > 0 && !selectedChecklistStratId) {
      setSelectedChecklistStratId(strategies[0].id || '');
    }
  }, [strategies, selectedChecklistStratId]);

  // Reset checklist checkboxes when strategy changes
  React.useEffect(() => {
    setCheckedRules({});
  }, [selectedChecklistStratId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez entrer un nom de stratégie.');
      return;
    }
    if (!rulesText.trim()) {
      alert('Veuillez entrer au moins une règle pour la check-list.');
      return;
    }

    setFormLoading(true);
    try {
      // Split textarea lines into rules array
      const rules = rulesText
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      await onAddStrategy({
        name,
        actif,
        riskPercent: parseFloat(riskPercent) || 1.0,
        targetRR: parseFloat(targetRR) || 2.5,
        rules,
        description: description || undefined,
      });

      // Reset form
      setName('');
      setActif('XAU/USD');
      setRiskPercent('1.0');
      setTargetRR('2.5');
      setRulesText('');
      setDescription('');
    } catch (err) {
      alert('Erreur lors de la création de la stratégie.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckboxChange = (index: number) => {
    setCheckedRules(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Calculate checklist progress
  const totalRules = activeChecklistStrat ? activeChecklistStrat.rules.length : 0;
  const checkedCount = activeChecklistStrat
    ? activeChecklistStrat.rules.filter((_, idx) => checkedRules[idx]).length
    : 0;
  const isComplete = totalRules > 0 && checkedCount === totalRules;

  return (
    <div className="main-layout" style={{ gridTemplateColumns: '1fr' }}>

      {/* Top Pre-trade interactive checklist widget */}
      {activeChecklistStrat && (
        <div className="card" style={{
          border: isComplete ? '1px solid var(--color-gain)' : '1px solid var(--border-color)',
          boxShadow: isComplete ? '0 0 20px rgba(0, 230, 118, 0.15)' : 'var(--shadow-md)',
          background: isComplete ? 'linear-gradient(135deg, rgba(22, 26, 38, 0.7) 0%, rgba(0, 230, 118, 0.05) 100%)' : 'var(--bg-card)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckSquare size={24} style={{ color: isComplete ? 'var(--color-gain)' : 'var(--gold-primary)' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Checklist de Validation Pré-Trade</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valide chaque critère technique avant d'ouvrir une position.</p>
              </div>
            </div>

            {/* Select strategy to load in checklist */}
            <div>
              <select
                className="input-field"
                style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem' }}
                value={selectedChecklistStratId}
                onChange={(e) => setSelectedChecklistStratId(e.target.value)}
              >
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist progress bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progression des validations :</span>
              <span style={{ fontWeight: 'bold', color: isComplete ? 'var(--color-gain)' : 'var(--gold-primary)' }}>
                {checkedCount} / {totalRules} ({totalRules > 0 ? Math.round((checkedCount / totalRules) * 100) : 0}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                width: `${totalRules > 0 ? (checkedCount / totalRules) * 100 : 0}%`,
                height: '100%',
                background: isComplete ? 'var(--color-gain)' : 'var(--gold-gradient)',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Checklist checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeChecklistStrat.rules.map((rule, idx) => (
              <div
                key={idx}
                onClick={() => handleCheckboxChange(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: checkedRules[idx] ? 'rgba(0, 230, 118, 0.03)' : 'rgba(8, 9, 13, 0.3)',
                  border: `1px solid ${checkedRules[idx] ? 'rgba(0, 230, 118, 0.2)' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${checkedRules[idx] ? 'var(--color-gain)' : 'var(--border-color)'}`,
                  background: checkedRules[idx] ? 'var(--color-gain)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}>
                  {checkedRules[idx] && <Check size={14} color="#000" strokeWidth={3} />}
                </div>
                <span style={{
                  fontSize: '0.92rem',
                  color: checkedRules[idx] ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: checkedRules[idx] ? 'line-through' : 'none',
                  opacity: checkedRules[idx] ? 0.75 : 1,
                  transition: 'all 0.2s ease'
                }}>
                  {rule}
                </span>
              </div>
            ))}
          </div>

          {/* Golden validation message */}
          {isComplete && (
            <div style={{
              marginTop: '1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.02) 100%)',
              border: '1px solid var(--color-gain)',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              textAlign: 'center',
              color: 'var(--color-gain)',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Award size={18} />
              Setup validé à 100%. Le ratio R:R et les règles de {activeChecklistStrat.name} sont respectés. Prêt à exécuter !
            </div>
          )}
        </div>
      )}

      {/* Main double column layout */}
      <div className="main-layout" style={{ marginTop: '0rem' }}>

        {/* Left Column: Create strategy form */}
        <form onSubmit={handleSubmit} className="card" style={{ height: 'fit-content' }}>
          <h3 className="card-title">
            <PlusCircle size={20} />
            Créer un Setup de Trading
          </h3>

          <div className="form-group">
            <label className="form-label">Nom de la stratégie</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Actif ciblé</label>
              <select className="input-field" value={actif} onChange={e => setActif(e.target.value)}>
                <option value="XAU/USD">Gold (XAU/USD)</option>
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="BTC/USD">Bitcoin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Risque par trade (%)</label>
              <input
                type="number"
                step="0.1"
                required
                className="input-field"
                value={riskPercent}
                onChange={e => setRiskPercent(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Objectif Ratio R:R ciblé</label>
            <input
              type="number"
              step="0.1"
              required
              className="input-field"
              value={targetRR}
              onChange={e => setTargetRR(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Règles de validation (une par ligne)</label>
            <textarea
              className="input-field"
              value={rulesText}
              onChange={e => setRulesText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description ou remarques</label>
            <textarea

              className="input-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" disabled={formLoading} className="btn">
            {formLoading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Création en cours...
              </>
            ) : (
              'Ajouter à mes Setups'
            )}
          </button>
        </form>

        {/* Right Column: List of saved strategies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="brand" style={{ gap: '0.5rem', marginBottom: '-0.5rem' }}>
            <Compass size={24} style={{ color: 'var(--gold-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mes Setups Actifs</h2>
          </div>

          {loading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner" />
            </div>
          ) : strategies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Compass size={48} style={{ color: 'var(--gold-secondary)', opacity: 0.3, margin: '0 auto 1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Aucune stratégie enregistrée</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Crée ta première stratégie personnalisée à l'aide du formulaire.
              </p>
            </div>
          ) : (
            strategies.map((strat) => (
              <div key={strat.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '4px solid var(--gold-secondary)' }}>
                {/* Strat Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{strat.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Actif ciblé : <strong style={{ color: 'var(--gold-primary)' }}>{strat.actif}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Es-tu sûr de vouloir supprimer cette stratégie ?')) {
                        onDeleteStrategy(strat.id || '');
                      }
                    }}
                    className="delete-btn"
                    style={{ padding: '0.35rem' }}
                    title="Supprimer la stratégie"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Description */}
                {strat.description && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {strat.description}
                  </p>
                )}

                {/* Setup Targets Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  background: 'rgba(8, 9, 13, 0.4)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Risque visé</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{strat.riskPercent}% du capital</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Target R:R</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-primary)' }}>{strat.targetRR}:1 ou +</span>
                  </div>
                </div>

                {/* Rules Details */}
                <div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <FileText size={12} />
                    Check-list de critères de validation
                  </span>
                  <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {strat.rules.map((rule, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
