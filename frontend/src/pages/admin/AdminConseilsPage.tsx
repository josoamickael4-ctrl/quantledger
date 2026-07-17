import React, { useEffect, useState } from 'react';

interface Conseil {
  id: string;
  rawText: string;
  simplifiedText: string;
  categorie: 'Psychologie' | 'Stratégie';
  createdAt: string;
}

interface Props {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  currentMember: { id: string; fullName: string; role: string } | null;
}

const excerpt = (text?: string, max = 120) => {
  const value = text?.trim() || '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

export const AdminConseilsPage: React.FC<Props> = ({ apiFetch, currentMember }) => {
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rawText, setRawText] = useState('');
  const [categorie, setCategorie] = useState<'Psychologie' | 'Stratégie'>('Stratégie');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRawText, setEditRawText] = useState('');
  const [editCategorie, setEditCategorie] = useState<'Psychologie' | 'Stratégie'>('Stratégie');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch('/api/conseils', {
        headers: { 'x-member-id': currentMember?.id || '' },
      });
      if (!r.ok) throw new Error('Erreur chargement');
      const data = await r.json();
      setConseils(data.data || data); // Handle both paginated and non-paginated responses
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!rawText.trim()) return;
    setCreating(true);
    try {
      const r = await apiFetch('/api/conseils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-id': currentMember?.id || '',
        },
        body: JSON.stringify({ rawText: rawText.trim(), categorie }),
      });
      if (!r.ok) throw new Error('Erreur création');
      const created = await r.json();
      setConseils(prev => [created, ...prev]);
      setRawText('');
      setCategorie('Stratégie');
    } catch (e: any) {
      alert(e.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce conseil ?')) return;
    try {
      const r = await apiFetch(`/api/conseils/${id}`, {
        method: 'DELETE',
        headers: { 'x-member-id': currentMember?.id || '' },
      });
      if (!r.ok) throw new Error('Erreur suppression');
      setConseils(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  const startEdit = (c: Conseil) => {
    setEditingId(c.id);
    setEditRawText(c.rawText);
    setEditCategorie(c.categorie);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const r = await apiFetch(`/api/conseils/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-member-id': currentMember?.id || '',
        },
        body: JSON.stringify({ rawText: editRawText.trim(), categorie: editCategorie }),
      });
      if (!r.ok) throw new Error('Erreur mise à jour');
      const updated = await r.json();
      setConseils(prev => prev.map(p => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ margin: 0 }}>Gestion des Conseils</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Créer, modifier et supprimer des conseils visibles par les membres.
        </p>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr auto' }}>
        <div>
          <select
            value={categorie}
            onChange={e => setCategorie(e.target.value as 'Psychologie' | 'Stratégie')}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          >
            <option value="Stratégie">Stratégie</option>
            <option value="Psychologie">Psychologie</option>
          </select>
          <textarea
            placeholder="Coller le conseil brut"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', minHeight: 120 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button type="submit" disabled={creating} style={{ padding: '0.6rem 1rem' }}>
            {creating ? 'Création…' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => { setRawText(''); setCategorie('Stratégie'); }}
            style={{ padding: '0.6rem 1rem' }}
          >
            Réinitialiser
          </button>
        </div>
      </form>

      {loading ? (
        <div>Chargement…</div>
      ) : error ? (
        <div style={{ color: '#ef4444' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem' }}>Catégorie</th>
                <th style={{ padding: '0.75rem' }}>Extrait</th>
                <th style={{ padding: '0.75rem' }}>Créé le</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conseils.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === c.id ? (
                      <select
                        value={editCategorie}
                        onChange={e => setEditCategorie(e.target.value as 'Psychologie' | 'Stratégie')}
                      >
                        <option value="Stratégie">Stratégie</option>
                        <option value="Psychologie">Psychologie</option>
                      </select>
                    ) : (
                      c.categorie
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === c.id ? (
                      <textarea
                        value={editRawText}
                        onChange={e => setEditRawText(e.target.value)}
                        style={{ width: '100%', minHeight: 80 }}
                      />
                    ) : (
                      excerpt(c.rawText || c.simplifiedText)
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {editingId === c.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(c.id)} style={{ marginRight: 8 }}>
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingId(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(c)} style={{ marginRight: 8 }}>
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(c.id)} style={{ color: '#ef4444' }}>
                          Supprimer
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
