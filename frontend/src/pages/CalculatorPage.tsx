import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, HelpCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Info, ShieldAlert } from 'lucide-react';

interface CalculatorResults {
  montantRisqueCompte: number;      // Risque cible dans la devise du compte
  montantRisqueUSD: number;         // Risque cible converti en USD
  distanceSL: number;               // Distance SL (USD/oz)
  distanceTP: number;               // Distance TP (USD/oz)
  lotSizeTheoretical: number;       // Lot théorique précis
  lotSizeEffective: number;         // Lot réel arrondi pour le broker (min 0.01, pas de 0.01)
  actualRiskCompte: number;         // Risque réel encouru dans la devise du compte avec le lot effectif
  actualRiskUSD: number;            // Risque réel encouru en USD avec le lot effectif
  positionSizeOuncesTheoretical: number; // Taille de position théorique en onces
  positionSizeOuncesEffective: number;   // Taille de position réelle en onces
  riskRewardRatio: number;          // Ratio R:R exact
  breakEvenPrice: number;           // Prix du BE
}

interface CalculatorPageProps {
  capital?: number;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ capital }) => {
  // Inputs state
  const [instrument, setInstrument] = useState('XAU/USD');
  const [devise, setDevise] = useState('USD');
  const [tauxChange, setTauxChange] = useState<string>('1.0');
  const [solde, setSolde] = useState<string>(() => {
    return capital !== undefined ? capital.toString() : '0';
  });
  const [typePosition, setTypePosition] = useState<'Achat' | 'Vente'>('Achat');
  const [prixEntree, setPrixEntree] = useState<string>('3350');
  const [prixSL, setPrixSL] = useState<string>('3345');
  const [prixTP, setPrixTP] = useState<string>('3362.5');
  const [risquePercent, setRisquePercent] = useState<string>('1');

  // Calculation results & validation state
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Automatically adjust exchange rate when devise changes
  useEffect(() => {
    if (devise === 'USD') {
      setTauxChange('1.0');
    } else if (devise === 'EUR') {
      setTauxChange('1.08');
    } else if (devise === 'GBP') {
      setTauxChange('1.28');
    } else if (devise === 'CHF') {
      setTauxChange('1.12');
    }
  }, [devise]);

  // Sync solde when capital prop changes
  useEffect(() => {
    if (capital !== undefined) {
      setSolde(capital.toString());
    }
  }, [capital]);

  // Rigorous calculation helper
  const performCalculation = (showError = false) => {
    const s = parseFloat(solde);
    const r = parseFloat(risquePercent);
    const e = parseFloat(prixEntree);
    const sl = parseFloat(prixSL);
    const tp = parseFloat(prixTP);
    const tx = parseFloat(tauxChange);

    // 1. Basic Validations (No NaN, greater than zero)
    if (isNaN(s) || s <= 0) {
      if (showError) setValidationError('Le solde du compte doit être un nombre strictement supérieur à 0.');
      setResults(null);
      return false;
    }
    if (isNaN(r) || r <= 0 || r > 100) {
      if (showError) setValidationError('Le pourcentage de risque doit être compris entre 0.01% et 100%.');
      setResults(null);
      return false;
    }
    if (isNaN(e) || e <= 0) {
      if (showError) setValidationError("Le prix d'entrée doit être un nombre strictement supérieur à 0.");
      setResults(null);
      return false;
    }
    if (isNaN(sl) || sl <= 0) {
      if (showError) setValidationError('Le prix du Stop Loss doit être un nombre strictement supérieur à 0.');
      setResults(null);
      return false;
    }
    if (isNaN(tp) || tp <= 0) {
      if (showError) setValidationError('Le prix du Take Profit doit être un nombre strictement supérieur à 0.');
      setResults(null);
      return false;
    }
    if (isNaN(tx) || tx <= 0) {
      if (showError) setValidationError('Le taux de change doit être un nombre strictement supérieur à 0.');
      setResults(null);
      return false;
    }

    // 2. Coherence and Division-by-Zero Checks
    if (e === sl) {
      if (showError) setValidationError("Le prix d'entrée et le Stop Loss ne peuvent pas être identiques (risque infini).");
      setResults(null);
      return false;
    }
    if (e === tp) {
      if (showError) setValidationError("Le prix d'entrée et le Take Profit ne peuvent pas être identiques.");
      setResults(null);
      return false;
    }
    if (sl === tp) {
      if (showError) setValidationError("Le Stop Loss et le Take Profit ne peuvent pas être identiques.");
      setResults(null);
      return false;
    }

    // 3. Trade Direction Checks
    if (typePosition === 'Achat') {
      if (sl >= e) {
        if (showError) setValidationError("Pour un Achat (Buy), le Stop Loss doit être inférieur au prix d'entrée.");
        setResults(null);
        return false;
      }
      if (tp <= e) {
        if (showError) setValidationError("Pour un Achat (Buy), le Take Profit doit être supérieur au prix d'entrée.");
        setResults(null);
        return false;
      }
    } else { // Vente
      if (sl <= e) {
        if (showError) setValidationError("Pour une Vente (Sell), le Stop Loss doit être supérieur au prix d'entrée.");
        setResults(null);
        return false;
      }
      if (tp >= e) {
        if (showError) setValidationError("Pour une Vente (Sell), le Take Profit doit être inférieur au prix d'entrée.");
        setResults(null);
        return false;
      }
    }

    // Clear validation error if all checks pass
    setValidationError(null);

    // 4. Mathematical calculations
    const montantRisqueCompte = s * (r / 100);
    const montantRisqueUSD = montantRisqueCompte * tx;
    const distanceSL = Math.abs(e - sl);
    const distanceTP = Math.abs(tp - e);

    // Theoretical Lot Size: Risk (USD) / (Distance SL * 100)
    const lotSizeTheoretical = distanceSL > 0 ? montantRisqueUSD / (distanceSL * 100) : 0;
    
    // Broker rounded lot size: Standard broker steps of 0.01 lot, rounding down for safety
    const lotSizeRounded = Math.floor(lotSizeTheoretical * 100) / 100;
    
    // Effective lot size is at least the minimum micro-lot (0.01) if theoretical size is > 0, 
    // otherwise 0. If rounded is 0, we set to 0.01 to indicate the smallest trade size but warn the trader.
    const lotSizeEffective = lotSizeRounded < 0.01 ? 0.01 : lotSizeRounded;

    // Actual Risk with the Effective Lot Size (in Account Currency & USD)
    const actualRiskUSD = lotSizeEffective * distanceSL * 100;
    const actualRiskCompte = actualRiskUSD / tx;

    // Position Size in ounces
    const positionSizeOuncesTheoretical = lotSizeTheoretical * 100;
    const positionSizeOuncesEffective = lotSizeEffective * 100;

    // Risk / Reward Ratio
    const riskRewardRatio = distanceSL > 0 ? distanceTP / distanceSL : 0;

    const breakEvenPrice = e;

    setResults({
      montantRisqueCompte,
      montantRisqueUSD,
      distanceSL,
      distanceTP,
      lotSizeTheoretical,
      lotSizeEffective,
      actualRiskCompte,
      actualRiskUSD,
      positionSizeOuncesTheoretical,
      positionSizeOuncesEffective,
      riskRewardRatio,
      breakEvenPrice
    });

    return true;
  };

  // Perform live calculation on any input change
  useEffect(() => {
    performCalculation(false);
  }, [solde, prixEntree, prixSL, prixTP, risquePercent, typePosition, instrument, devise, tauxChange]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    performCalculation(true);
  };

  const handleReset = () => {
    setInstrument('XAU/USD');
    setDevise('USD');
    setTauxChange('1.0');
    setSolde('0');
    setTypePosition('Achat');
    setPrixEntree('3350');
    setPrixSL('3345');
    setPrixTP('3362.5');
    setRisquePercent('1');
    setValidationError(null);
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  // Visual layout percentages
  let slPercent = 0;
  let tpPercent = 100;
  if (results) {
    const totalRange = results.distanceSL + results.distanceTP;
    if (totalRange > 0) {
      if (typePosition === 'Achat') {
        slPercent = (results.distanceSL / totalRange) * 100;
        tpPercent = 100 - slPercent;
      } else {
        tpPercent = (results.distanceTP / totalRange) * 100;
        slPercent = 100 - tpPercent;
      }
    }
  }

  // Warn if actual risk exceeds target risk
  const riskExceeded = results && (results.actualRiskCompte > results.montantRisqueCompte * 1.01);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator className="brand-icon" style={{ width: '24px', height: '24px' }} />
            Calculatrice de Taille de Position
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Audit quantitatif rigoureux et calcul de loterie pour l'Or (XAU/USD).
          </p>
        </div>
        <button
          onClick={handleReset}
          className="btn"
          style={{
            width: 'auto',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: '10px',
            transform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="Réinitialiser les paramètres"
        >
          <RefreshCw size={14} />
          Réinitialiser
        </button>
      </div>

      <div className="main-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Saisie Form Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            <Info size={18} />
            Paramètres du Trade
          </h3>

          <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Position side selector (Achat / Vente) */}
            <div className="form-group">
              <label className="form-label">Sens de l'opération</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setTypePosition('Achat')}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: '1px solid ' + (typePosition === 'Achat' ? 'var(--color-gain)' : 'var(--border-color)'),
                    background: typePosition === 'Achat' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(8, 9, 13, 0.4)',
                    color: typePosition === 'Achat' ? 'var(--color-gain)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowUpRight size={18} />
                  ACHAT (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setTypePosition('Vente')}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: '1px solid ' + (typePosition === 'Vente' ? 'var(--color-perte)' : 'var(--border-color)'),
                    background: typePosition === 'Vente' ? 'rgba(255, 23, 68, 0.1)' : 'rgba(8, 9, 13, 0.4)',
                    color: typePosition === 'Vente' ? 'var(--color-perte)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowDownRight size={18} />
                  VENTE (SELL)
                </button>
              </div>
            </div>

            {/* Instrument and Account Currency */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-instrument">Instrument</label>
                <input
                  id="calc-instrument"
                  type="text"
                  className="input-field"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="ex: XAU/USD"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calc-devise">Devise Compte</label>
                <select
                  id="calc-devise"
                  className="input-field"
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF (₣)</option>
                </select>
              </div>
            </div>

            {/* exchange rate field if account currency is not USD */}
            {devise !== 'USD' && (
              <div className="form-group" style={{
                background: 'rgba(197, 160, 89, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 1rem'
              }}>
                <label className="form-label" htmlFor="calc-exchange-rate" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold-primary)' }}>
                  <span>Taux de conversion ({devise}/USD)</span>
                  <span title="Indispensable car XAU/USD est coté en Dollars américains. Convertit votre risque dans la devise du marché.">
                    <HelpCircle size={14} />
                  </span>
                </label>
                <input
                  id="calc-exchange-rate"
                  type="number"
                  step="any"
                  className="input-field"
                  value={tauxChange}
                  onChange={(e) => setTauxChange(e.target.value)}
                  placeholder="1.08"
                  required
                />
              </div>
            )}

            {/* Account Balance and Risk % */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-solde">Solde du compte</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="calc-solde"
                    type="number"
                    step="any"
                    className="input-field"
                    value={solde}
                    onChange={(e) => setSolde(e.target.value)}
                    placeholder="1000"
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {devise}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calc-risk">Risque par trade (%)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="calc-risk"
                    type="number"
                    step="any"
                    className="input-field"
                    value={risquePercent}
                    onChange={(e) => setRisquePercent(e.target.value)}
                    placeholder="1"
                    min="0.01"
                    max="100"
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Prices section */}
            <div className="form-group">
              <label className="form-label" htmlFor="calc-entry">Prix d'entrée (USD/oz)</label>
              <input
                id="calc-entry"
                type="number"
                step="any"
                className="input-field"
                value={prixEntree}
                onChange={(e) => setPrixEntree(e.target.value)}
                placeholder="3350"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-sl">Stop Loss (SL)</label>
                <input
                  id="calc-sl"
                  type="number"
                  step="any"
                  className="input-field"
                  style={{ borderColor: 'rgba(255, 23, 68, 0.3)' }}
                  value={prixSL}
                  onChange={(e) => setPrixSL(e.target.value)}
                  placeholder="3345"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calc-tp">Take Profit (TP)</label>
                <input
                  id="calc-tp"
                  type="number"
                  step="any"
                  className="input-field"
                  style={{ borderColor: 'rgba(0, 230, 118, 0.3)' }}
                  value={prixTP}
                  onChange={(e) => setPrixTP(e.target.value)}
                  placeholder="3362.5"
                  required
                />
              </div>
            </div>

            {/* Error alerts if any */}
            {validationError && (
              <div style={{
                background: 'rgba(255, 23, 68, 0.1)',
                border: '1px solid rgba(255, 23, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'var(--color-perte)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            <button type="submit" className="btn">
              Calculer la taille
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid ' + (results ? 'var(--gold-secondary)' : 'var(--border-color)'),
            boxShadow: results ? 'var(--shadow-lg), var(--shadow-gold)' : 'var(--shadow-md)'
          }}>
            {/* Visual Gold glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: results ? 'var(--gold-gradient)' : 'var(--border-color)'
            }} />

            <h3 className="card-title">
              <Calculator size={18} />
              Résultats du Calcul
            </h3>

            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Standard broker sizing (rounded down) */}
                <div style={{
                  background: 'rgba(255, 215, 0, 0.03)',
                  border: '1px solid rgba(197, 160, 89, 0.25)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '15px',
                    fontSize: '0.65rem',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '20px',
                    color: 'var(--gold-primary)',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    Taille Conseillée (Broker)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center', marginTop: '0.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Volume à Saisir
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {results.lotSizeEffective.toFixed(2)}
                        <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.2rem', color: 'var(--text-secondary)' }}>Lot</span>
                      </div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Volume en Onces
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {formatNumber(results.positionSizeOuncesEffective, 2)}
                        <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.2rem', color: 'var(--text-secondary)' }}>oz</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Theoretical precise sizing */}
                <div style={{
                  background: 'rgba(8, 9, 13, 0.4)',
                  border: '1px dashed var(--border-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taille théorique (Précise) :</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {results.lotSizeTheoretical.toFixed(4)} Lots ({results.positionSizeOuncesTheoretical.toFixed(2)} oz)
                  </span>
                </div>

                {/* 3. Detailed Metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  
                  {/* Target Risk */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Risque Cible</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatNumber(results.montantRisqueCompte, 2)} {devise} ({risquePercent}%)
                    </span>
                  </div>

                  {/* Real Risk (Broker size) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Risque Réel</span>
                    <span style={{
                      fontWeight: 700,
                      color: riskExceeded ? 'var(--color-perte)' : 'var(--color-gain)'
                    }}>
                      {formatNumber(results.actualRiskCompte, 2)} {devise}
                    </span>
                  </div>

                  {/* Distance Stop Loss */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(197, 160, 89, 0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Distance Stop Loss</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatNumber(results.distanceSL, 2)} USD
                    </span>
                  </div>

                  {/* Distance Take Profit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(197, 160, 89, 0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Distance Take Profit</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatNumber(results.distanceTP, 2)} USD
                    </span>
                  </div>

                  {/* Risk/Reward Ratio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(197, 160, 89, 0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Ratio Risk/Reward</span>
                    <span style={{
                      fontWeight: 700,
                      color: results.riskRewardRatio >= 2 ? 'var(--color-gain)' : results.riskRewardRatio >= 1 ? '#ffa751' : 'var(--color-perte)'
                    }}>
                      1 : {results.riskRewardRatio.toFixed(2)}
                    </span>
                  </div>

                  {/* Break Even Price */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(197, 160, 89, 0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Break Even (BE)</span>
                    <span style={{ fontWeight: 600, color: 'var(--gold-primary)', fontFamily: 'monospace' }}>
                      {formatNumber(results.breakEvenPrice, 2)} USD
                    </span>
                  </div>

                </div>

                {/* Risk Exceeded Alert (Risk too high relative to targets) */}
                {riskExceeded && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-perte)',
                    background: 'rgba(255, 23, 68, 0.1)',
                    border: '1px solid rgba(255, 23, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                    <span>Attention : La taille minimale du broker dépasse le risque cible ({risquePercent}%) pour cette distance de SL.</span>
                  </div>
                )}

                {/* Lot size is very small warning */}
                {results.lotSizeTheoretical < 0.01 && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#ffa751',
                    background: 'rgba(255, 167, 81, 0.1)',
                    border: '1px solid rgba(255, 167, 81, 0.2)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>Le volume théorique ({results.lotSizeTheoretical.toFixed(4)}) est inférieur au micro-lot broker (0.01). Risque réel arrondi vers le haut.</span>
                  </div>
                )}

                {/* Graphique de trade stylisé */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Visualisation technique</span>
                  <div style={{ height: '36px', background: 'rgba(8,9,13,0.6)', borderRadius: '8px', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                    
                    {typePosition === 'Achat' ? (
                      <>
                        <div style={{ width: `${slPercent}%`, background: 'rgba(255, 23, 68, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', borderRight: '2px solid var(--color-perte)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-perte)', fontWeight: 'bold' }}>SL ({formatNumber(results.distanceSL, 1)})</span>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-gain)', fontWeight: 'bold' }}>TP ({formatNumber(results.distanceTP, 1)})</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: `${tpPercent}%`, background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', borderRight: '2px solid var(--color-gain)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-gain)', fontWeight: 'bold' }}>TP ({formatNumber(results.distanceTP, 1)})</span>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255, 23, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-perte)', fontWeight: 'bold' }}>SL ({formatNumber(results.distanceSL, 1)})</span>
                        </div>
                      </>
                    )}
                    {/* Middle bar indicating entry */}
                    <div style={{
                      position: 'absolute',
                      left: typePosition === 'Achat' ? `${slPercent}%` : `${tpPercent}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: 'var(--gold-primary)',
                      transform: 'translateX(-50%)',
                      boxShadow: '0 0 8px var(--gold-primary)'
                    }} title="Prix d'entrée" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    <span>{typePosition === 'Achat' ? `SL: ${formatNumber(parseFloat(prixSL), 1)}` : `TP: ${formatNumber(parseFloat(prixTP), 1)}`}</span>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>Entrée: {formatNumber(parseFloat(prixEntree), 1)}</span>
                    <span>{typePosition === 'Achat' ? `TP: ${formatNumber(parseFloat(prixTP), 1)}` : `SL: ${formatNumber(parseFloat(prixSL), 1)}`}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <HelpCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: 'var(--gold-secondary)' }} />
                <p style={{ fontSize: '0.85rem' }}>Saisissez des paramètres cohérents et valides pour afficher les détails du lot et de la position.</p>
              </div>
            )}
          </div>

          {/* Educational / Explanations Card */}
          <div className="card" style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ color: 'var(--gold-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Info size={16} />
              Spécifications du contrat Or (XAU/USD)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>1.00 Lot standard</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>100 onces (oz)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>0.10 Mini-Lot</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>10 onces (oz)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>0.01 Micro-Lot</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>1 once (oz)</span>
              </div>
              
              <div style={{
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border-color)',
                fontSize: '0.8rem',
                lineHeight: '1.4'
              }}>
                <span style={{ color: 'var(--gold-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>💡 Qu'est-ce que le Break Even (BE) ?</span>
                Le Break Even correspond au niveau de prix auquel la position ne réalise ni gain ni perte.
                Bien que calculé ici directement sur le prix d'entrée, gardez à l'esprit que le BE réel inclut les commissions fixes, les frais de swap nocturnes, et le spread d'achat/vente appliqué par votre courtier.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
