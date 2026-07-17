import React, { useState } from 'react';
import { Terminal, Sparkles, Brain, Compass, HelpCircle } from 'lucide-react';

interface Conseil {
  id?: string;
  rawText: string;
  simplifiedText: string;
  categorie: 'Psychologie' | 'Stratégie';
  createdAt?: string;
}

interface ConseilsTabProps {
  onAddConseil: (conseil: Omit<Conseil, 'id' | 'createdAt' | 'simplifiedText'>) => Promise<void>;
  lastAddedConseil: Conseil | null;
}

export const ConseilsTab: React.FC<ConseilsTabProps> = ({
  onAddConseil,
  lastAddedConseil,
}) => {
  const [rawText, setRawText] = useState('');
  const [categorie, setCategorie] = useState<'Psychologie' | 'Stratégie'>('Stratégie');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      alert('Veuillez coller un conseil brut.');
      return;
    }

    setLoading(true);
    try {
      await onAddConseil({ rawText, categorie });
      setRawText('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la simplification du conseil.");
    } finally {
      setLoading(false);
    }
  };

  const renderAdviceContent = (text: string) => {
    if (!text) {
      return { bullets: [], actionImmediate: '', fallbackParagraphs: [] };
    }
    const lines = text.split('\n');
    const bullets: string[] = [];
    let actionImmediate = '';
    let readingAction = false;
    let fallbackParagraphs: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('action immédiate') || trimmed.includes('⚡') || trimmed.includes('Action')) {
        readingAction = true;
        continue;
      }
      if (readingAction) {
        if (trimmed) actionImmediate += trimmed + ' ';
        continue;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        bullets.push(trimmed.substring(1).trim());
      } else if (trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('=')) {
        fallbackParagraphs.push(trimmed);
      }
    }

    return {
      bullets,
      actionImmediate: actionImmediate.replace(/\*\*/g, '').trim(),
      fallbackParagraphs
    };
  };

  return (
    <div className="main-layout" style={{ gridTemplateColumns: '1fr' }}>
      <div className="main-layout">
        
        {/* Left Column: Input Form */}
        <form onSubmit={handleSubmit} className="card" style={{ height: 'fit-content' }}>
          <h3 className="card-title">
            <Terminal size={20} />
            Coller un Conseil Brut
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', marginTop: '-0.75rem' }}>
            Collez un message brut de votre canal de trading Telegram/Discord pour le synthétiser et l'actionner.
          </p>

          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select
              className="input-field"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as any)}
            >
              <option value="Stratégie">Stratégie 📐</option>
              <option value="Psychologie">Psychologie 🧠</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Texte Brut du Canal</label>
            <textarea
              required
              rows={8}
              placeholder="Collez ici le conseil brut copié..."
              className="input-field"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn">
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Analyse IA en cours...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Simplifier & Enregistrer
              </>
            )}
          </button>
        </form>

        {/* Right Column: Preview of the last simplified advice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: lastAddedConseil ? 'flex-start' : 'center' }}>
            {lastAddedConseil ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 className="card-title" style={{ color: 'var(--gold-primary)' }}>
                  <Sparkles size={18} />
                  Dernier Conseil Simplifié
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '-0.5rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 'bold',
                    color: 'var(--gold-primary)', background: 'rgba(197, 160, 89, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px',
                    border: '1px solid rgba(197, 160, 89, 0.25)'
                  }}>
                    {lastAddedConseil.categorie === 'Psychologie' ? <Brain size={12} /> : <Compass size={12} />}
                    {lastAddedConseil.categorie}
                  </span>
                </div>

                {/* Bullets */}
                <div style={{ color: 'var(--text-primary)' }}>
                  {(() => {
                    const parsed = renderAdviceContent(lastAddedConseil.simplifiedText);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {parsed.bullets.length > 0 ? (
                          <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', lineHeight: 1.5, fontSize: '0.92rem' }}>
                            {parsed.bullets.map((b, idx) => (
                              <li key={idx}>
                                {b.split('**').map((part, index) => 
                                  index % 2 === 1 ? <strong key={index} style={{ color: 'var(--gold-primary)' }}>{part}</strong> : part
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          parsed.fallbackParagraphs.map((p, idx) => (
                            <p key={idx} style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{p}</p>
                          ))
                        )}

                        {parsed.actionImmediate && (
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, rgba(197, 160, 89, 0.08) 100%)',
                            border: '1px solid var(--border-color-hover)', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-sm)', marginTop: '0.5rem'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--gold-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              ⚡ Action Immédiate
                            </div>
                            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{parsed.actionImmediate}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                <HelpCircle size={48} style={{ color: 'var(--gold-secondary)', opacity: 0.3, margin: '0 auto 1rem' }} />
                <h3>Aucun conseil saisi</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Collez un message brut à gauche pour générer et voir sa fiche synthétique.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
