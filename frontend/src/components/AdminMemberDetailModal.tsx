import React, { useState } from 'react';
import {
  X, Mail, Phone, Globe, Calendar, Copy, Eye, EyeOff, CheckCircle, Edit
} from 'lucide-react';

const GOLD = '#ffd700';
const GREEN = '#00e676';
const RED = '#ff1744';

interface MemberDetails {
  member: {
    id: string; fullName: string; email?: string; phone?: string; facebook?: string;
    accessCode: string; role: string; isActive: boolean;
    createdAt: string; updatedAt: string; lastLoginAt?: string;
  };
}

interface AdminMemberDetailModalProps {
  memberId: string;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onClose: () => void;
}

export const AdminMemberDetailModal: React.FC<AdminMemberDetailModalProps> = ({ memberId, apiFetch, onClose }) => {
  const [data, setData] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeVisible, setCodeVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', facebook: '' });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    apiFetch(`/api/members/${memberId}`)
      .then(r => {
        if (!r.ok) throw new Error('Erreur de chargement');
        return r.json();
      })
      .then(d => { setData({ member: d }); setLoading(false); })
      .catch(() => { setError('Impossible de charger les détails du membre.'); setLoading(false); });
  }, [memberId, apiFetch]);

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.member.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (!data) return;
    setEditForm({
      fullName: data.member.fullName,
      email: data.member.email || '',
      phone: data.member.phone || '',
      facebook: data.member.facebook || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ fullName: '', email: '', phone: '', facebook: '' });
  };

  const handleSaveEdit = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const response = await apiFetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
          facebook: editForm.facebook || undefined,
        }),
      });

      if (!response.ok) throw new Error('Erreur de mise à jour');

      const updated = await response.json();
      setData({ member: updated });
      setIsEditing(false);
    } catch (err) {
      alert('Erreur lors de la mise à jour du membre');
    } finally {
      setSaving(false);
    }
  };

  // Prevent backdrop click from closing modal accidentally
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: 'linear-gradient(145deg, #0d1020, #0a0c18)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: '24px', width: '100%', maxWidth: 860,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,215,0,0.08)',
        padding: '2rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD}30, ${GOLD}10)`,
              border: `1px solid ${GOLD}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 800, color: GOLD,
            }}>
              {loading ? '?' : data?.member.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {loading ? 'Chargement…' : data?.member.fullName}
              </h2>
              {data && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px',
                    background: data.member.isActive ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.12)',
                    color: data.member.isActive ? GREEN : RED,
                    border: `1px solid ${data.member.isActive ? GREEN : RED}40`,
                    textTransform: 'uppercase',
                  }}>
                    {data.member.isActive ? '● Actif' : '● Désactivé'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Membre depuis {new Date(data.member.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {data && data.member.role !== 'admin' && (
              <button
                onClick={handleEdit}
                disabled={isEditing}
                style={{
                  background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '10px', width: 36, height: 36, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: isEditing ? 'not-allowed' : 'pointer', color: '#ffd700',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                title="Modifier le membre"
              >
                <Edit size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', width: 36, height: 36, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = RED; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: '1rem' }}>
            <div style={{ width: 40, height: 40, border: `3px solid rgba(255,215,0,0.15)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chargement de la fiche membre…</span>
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {data && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Edit Form */}
            {isEditing ? (
              <div style={{ background: 'rgba(255,215,0,0.03)', borderRadius: '14px', border: '1px solid rgba(255,215,0,0.2)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                  ✏️ Modifier le membre
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nom complet *</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.3)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>E-mail</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.3)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Téléphone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.3)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Facebook</label>
                    <input
                      type="text"
                      value={editForm.facebook}
                      onChange={e => setEditForm({ ...editForm, facebook: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.3)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !editForm.fullName.trim()}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: 'var(--gold-gradient)', border: 'none', color: '#000', cursor: saving || !editForm.fullName.trim() ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Contacts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {/* Info Contact */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                      📋 Informations
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {data.member.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{data.member.email}</span>
                        </div>
                      )}
                      {data.member.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{data.member.phone}</span>
                        </div>
                      )}
                      {data.member.facebook && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Globe size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>{data.member.facebook}</span>
                        </div>
                      )}
                      {data.member.lastLoginAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span>Dernière connexion : {new Date(data.member.lastLoginAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {!data.member.email && !data.member.phone && !data.member.facebook && !data.member.lastLoginAt && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune info de contact</span>
                      )}
                    </div>
                  </div>

                  {/* Code d'accès */}
                  <div style={{ background: 'rgba(255,215,0,0.03)', borderRadius: '14px', border: '1px solid rgba(255,215,0,0.12)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                      🔑 Code d'accès
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: '0.08em',
                        color: codeVisible ? GOLD : 'var(--text-muted)',
                        background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.75rem', borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)', flex: 1, minWidth: 0,
                      }}>
                        {codeVisible ? data.member.accessCode : '••••-••••-••••-••••-••••'}
                      </span>
                      <button
                        onClick={() => setCodeVisible(v => !v)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                      >
                        {codeVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={copyCode}
                        style={{ background: 'none', border: 'none', color: copied ? GREEN : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', transition: 'color 0.2s' }}
                      >
                        {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Performance de trading - Masquée pour confidentialité */}
                {/* Les performances de trading ne sont pas affichées pour respecter la vie privée des clients */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
