import React, { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';

interface Conseil {
  id?: string;
  rawText: string;
  categorie: 'Psychologie' | 'Stratégie';
}

interface EditConseilModalProps {
  conseil: Conseil;
  onClose: () => void;
  onSave: (id: string, updates: { rawText: string; categorie: 'Psychologie' | 'Stratégie' }) => Promise<void>;
}

export const EditConseilModal: React.FC<EditConseilModalProps> = ({ conseil, onClose, onSave }) => {
  const [rawText, setRawText] = useState(conseil.rawText);
  const [categorie, setCategorie] = useState<'Psychologie' | 'Stratégie'>(conseil.categorie);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      await onSave(conseil.id!, { rawText, categorie });
      onClose();
    } catch (err) {
      alert("Erreur lors de la sauvegarde du conseil.");
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
            Modifier le Conseil
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="input-field" value={categorie} onChange={e => setCategorie(e.target.value as any)}>
                <option value="Stratégie">Stratégie 📐</option>
                <option value="Psychologie">Psychologie 🧠</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Texte brut du conseil</label>
              <textarea
                required
                rows={8}
                className="input-field"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
           
              />
            </div>

            <div className="info-box" style={{ marginTop: '0.5rem' }}>
              <Pencil size={16} />
              <span>La simplification IA sera régénérée automatiquement à la sauvegarde.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Simplification...</>
              ) : 'Re-simplifier & Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
