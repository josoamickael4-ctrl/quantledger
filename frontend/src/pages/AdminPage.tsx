import React, { useState, useEffect } from 'react';
import { Users, Check, X, Trash2, ShieldAlert, Loader2, Search, Calendar, Mail } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AdminPageProps {
  currentUser: { id: string; name: string; email: string; role: string } | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/members', {
        headers: {
          'x-member-role': currentUser?.role || 'member',
        },
      });

      if (!response.ok) {
        throw new Error("Impossible de charger les utilisateurs.");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-member-role': currentUser?.role || 'member',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur de mise à jour.");
      }

      // Success, update local state
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur définitivement ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'x-member-role': currentUser?.role || 'member',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur de suppression.");
      }

      // Success, update local state
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Intro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Gestion des Utilisateurs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
            Validez les nouvelles inscriptions et gérez les rôles d'accès.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
          <Users size={16} style={{ color: 'var(--gold-primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {users.length} Utilisateur(s) au total
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou adresse e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.25rem',
              background: 'rgba(197, 160, 89, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--gold-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chargement des membres...</span>
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={20} style={{ color: '#ef4444' }} />
            <span style={{ color: '#fca5a5', fontSize: '0.88rem' }}>{error}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Aucun utilisateur trouvé.
          </div>
        ) : (
          /* Users list table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>E-mail</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Rôle</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Statut</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Créé le</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  // Badge design
                  let badgeBg = 'rgba(148, 163, 184, 0.1)';
                  let badgeColor = '#94a3b8';
                  let statusLabel = 'En attente';

                  if (user.status === 'approved') {
                    badgeBg = 'rgba(16, 185, 129, 0.1)';
                    badgeColor = '#10b981';
                    statusLabel = 'Approuvé';
                  } else if (user.status === 'rejected') {
                    badgeBg = 'rgba(239, 68, 68, 0.1)';
                    badgeColor = '#ef4444';
                    statusLabel = 'Rejeté';
                  }

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', verticalAlign: 'middle' }}>
                      {/* Name */}
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{user.role === 'admin' ? '🛡️' : '👤'}</span>
                          <span>{user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          background: user.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: user.role === 'admin' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                          border: user.role === 'admin' ? '1px solid rgba(212, 175, 55, 0.3)' : 'none'
                        }}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          background: badgeBg,
                          color: badgeColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Created date */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          <span>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {/* Approve button */}
                          {user.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                              title="Approuver l'utilisateur"
                              style={{
                                border: 'none',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {/* Reject button */}
                          {user.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'rejected')}
                              title="Rejeter l'utilisateur"
                              style={{
                                border: 'none',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                            >
                              <X size={16} />
                            </button>
                          )}

                          {/* Divider line if actions are available */}
                          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.08)' }} />

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            title="Supprimer définitivement"
                            disabled={user.id === currentUser?.id}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: user.id === currentUser?.id ? 'var(--text-muted)' : '#94a3b8',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: user.id === currentUser?.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => { if (user.id !== currentUser?.id) e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { if (user.id !== currentUser?.id) e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
