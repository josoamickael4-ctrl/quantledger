import React, { useState } from 'react';
import { Search, Brain, Compass, MessageSquare, Trash2, ArrowUpDown, Pencil } from 'lucide-react';

interface Conseil {
  id?: string;
  rawText: string;
  simplifiedText: string;
  categorie: 'Psychologie' | 'Stratégie';
  createdAt?: string;
}

interface ConseilsListPageProps {
  conseils: Conseil[];
  onEditConseil: (conseil: Conseil) => void;
  onDeleteConseil: (id: string) => Promise<void>;
  loading: boolean;
}

export const ConseilsListPage: React.FC<ConseilsListPageProps> = ({
  conseils,
  onEditConseil,
  onDeleteConseil,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Tous' | 'Psychologie' | 'Stratégie'>('Tous');
  const [expandedRaw, setExpandedRaw] = useState<{ [key: string]: boolean }>({});

  const toggleRaw = (id: string) => {
    setExpandedRaw(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderAdviceContent = (text: string) => {
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

  // Filter
  const filteredConseils = conseils.filter(c => {
    const matchesCategory = selectedCategory === 'Tous' || c.categorie === selectedCategory;
    const matchesSearch =
      (c.rawText && c.rawText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.simplifiedText && c.simplifiedText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header, Search & Category filters */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Répertoire des Conseils Pro</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consultez les raccourcis techniques et psychologiques simplifiés par l'IA.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Tous', 'Psychologie', 'Stratégie'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className="btn"
                style={{
                  width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '8px',
                  background: selectedCategory === cat ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                  border: 'none', transform: 'none'
                }}
              >
                {cat === 'Psychologie' ? '🧠 Psychologie' : cat === 'Stratégie' ? '📐 Stratégie' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher dans les conseils..."
            className="input-field"
            style={{ paddingLeft: '2.75rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : filteredConseils.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <MessageSquare size={48} style={{ color: 'var(--gold-secondary)', opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>Aucun conseil disponible</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Modifie ta recherche ou ajoute de nouveaux conseils.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredConseils.map(c => {
            const formattedDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '';
            const parsed = renderAdviceContent(c.simplifiedText);
            const isPsych = c.categorie === 'Psychologie';

            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: `4px solid ${isPsych ? '#b38728' : 'var(--gold-primary)'}` }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 'bold',
                      color: 'var(--gold-primary)', background: 'rgba(197, 160, 89, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px',
                      border: '1px solid rgba(197, 160, 89, 0.25)', marginBottom: '0.4rem'
                    }}>
                      {isPsych ? <Brain size={12} /> : <Compass size={12} />}
                      {c.categorie}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ajouté le {formattedDate}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="edit-btn" onClick={() => onEditConseil(c)} title="Modifier ce conseil" style={{ padding: '0.3rem' }}>
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Supprimer ce conseil ?')) onDeleteConseil(c.id!); }}
                      className="delete-btn"
                      style={{ padding: '0.3rem' }}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Bullets content */}
                <div style={{ flex: 1, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {parsed.bullets.length > 0 ? (
                    <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.4, fontSize: '0.9rem' }}>
                      {parsed.bullets.map((bullet, idx) => (
                        <li key={idx}>
                          {bullet.split('**').map((part, index) => 
                            index % 2 === 1 ? <strong key={index} style={{ color: 'var(--gold-primary)' }}>{part}</strong> : part
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    parsed.fallbackParagraphs.map((para, idx) => (
                      <p key={idx} style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{para}</p>
                    ))
                  )}
                </div>

                {/* Action Box */}
                {parsed.actionImmediate && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, rgba(197, 160, 89, 0.08) 100%)',
                    border: '1px solid var(--border-color-hover)', borderRadius: '12px', padding: '0.85rem 1rem', boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--gold-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      ⚡ Action Immédiate
                    </div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{parsed.actionImmediate}</p>
                  </div>
                )}

                {/* Expand raw text */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => toggleRaw(c.id!)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  >
                    <ArrowUpDown size={12} />
                    {expandedRaw[c.id!] ? 'Masquer le texte brut' : 'Voir le texte brut'}
                  </button>
                  {expandedRaw[c.id!] && (
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem',
                      fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', marginTop: '0.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {c.rawText}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
