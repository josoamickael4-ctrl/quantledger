import React, { useState, useEffect } from 'react';
import { Trash2, ShieldAlert, Loader2, Search, Calendar, Mail, Phone, Globe, Plus, Copy, RefreshCw, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminMemberDetailModal } from '../components/AdminMemberDetailModal';

interface MemberData {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  facebook?: string;
  accessCode: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profilePhoto?: string;
}

interface MembersPageProps {
  currentMember: { id: string; fullName: string; role: string } | null;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const MembersPage: React.FC<MembersPageProps> = ({ currentMember, apiFetch }) => {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '30d' | '90d'>('all');
  const [sortCol, setSortCol] = useState<'fullName' | 'createdAt' | 'isActive' | 'lastLoginAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Create Member Modal/Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFacebook, setNewFacebook] = useState('');
  const [creating, setCreating] = useState(false);

  // Visibility map for codes
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

  const fetchMembers = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/members?page=${page}&limit=50`, {
        headers: {
          'x-member-role': currentMember?.role || 'member',
        },
      });

      if (!response.ok) {
        throw new Error("Impossible de charger la liste des membres.");
      }

      const data = await response.json();
      setMembers(data.data || data); // Handle both paginated and non-paginated responses
      setTotalMembers(data.total || (data.data || data).length || 0);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(currentPage);
  }, [currentMember, currentPage]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-member-role': currentMember?.role || 'member',
        },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          facebook: newFacebook.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du membre.");
      }

      const created = await response.json();
      setMembers(prev => [created, ...prev]);
      
      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewFacebook('');
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-member-role': currentMember?.role || 'member',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut.");
      }

      const updated = await response.json();
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegenerateCode = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir générer un nouveau code d'accès ? L'ancien code sera désactivé immédiatement.")) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${id}/regenerate-code`, {
        method: 'PATCH',
        headers: {
          'x-member-role': currentMember?.role || 'member',
        },
      });

      if (!response.ok) {
        throw new Error("Erreur de régénération.");
      }

      const updated = await response.json();
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm("Supprimer ce client définitivement ? Toutes ses données associées ne seront plus accessibles.")) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'x-member-role': currentMember?.role || 'member',
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression.");
      }

      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Code d'accès copié dans le presse-papiers !");
  };

  const toggleCodeVisibility = (id: string) => {
    setVisibleCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Jamais';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const formatDateWithYear = (dateString: string | undefined) => {
    if (!dateString) return 'Jamais';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
    } catch {
      return 'Date invalide';
    }
  };

  const getDateValue = (dateString: string | undefined) => {
    if (!dateString) return 0;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 0;
      return date.getTime();
    } catch {
      return 0;
    }
  };

  const filteredMembers = members
    .filter(m => {
      const matchSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? m.isActive : !m.isActive);
      
      // Date range filter
      let matchDateRange = true;
      if (dateRangeFilter !== 'all') {
        const createdDate = new Date(m.createdAt);
        if (!isNaN(createdDate.getTime())) {
          const now = new Date();
          const days = dateRangeFilter === '30d' ? 30 : 90;
          const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          matchDateRange = createdDate >= cutoff;
        } else {
          matchDateRange = false;
        }
      }
      
      return matchSearch && matchStatus && matchDateRange;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
      else if (sortCol === 'createdAt') cmp = getDateValue(a.createdAt) - getDateValue(b.createdAt);
      else if (sortCol === 'isActive') cmp = (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1);
      else if (sortCol === 'lastLoginAt') {
        const aDate = getDateValue(a.lastLoginAt);
        const bDate = getDateValue(b.lastLoginAt);
        cmp = aDate - bDate;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (col: 'fullName' | 'createdAt' | 'isActive' | 'lastLoginAt') => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '0.25rem', verticalAlign: 'middle', opacity: sortCol === col ? 1 : 0.3 }}>
      <ChevronUp size={9} style={{ color: sortCol === col && sortDir === 'asc' ? '#ffd700' : undefined, marginBottom: -2 }} />
      <ChevronDown size={9} style={{ color: sortCol === col && sortDir === 'desc' ? '#ffd700' : undefined }} />
    </span>
  );

  return (
    <>
      {selectedMemberId && (
        <AdminMemberDetailModal
          memberId={selectedMemberId}
          apiFetch={apiFetch}
          onClose={() => setSelectedMemberId(null)}
        />
      )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Intro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Portefeuille Clients (Membres)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
            Gérez vos clients, visualisez leurs codes d'accès uniques et activez/désactivez leurs comptes.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            background: 'var(--gold-gradient)',
            border: 'none',
            borderRadius: '10px',
            color: '#06070a',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus size={16} />
          Créer un Client
        </button>
      </div>

      {/* Slideout/Form Overlay */}
      {showAddForm && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontFamily: 'Outfit, sans-serif', color: 'var(--gold-primary)' }}>Nouveau client</h3>
          <form onSubmit={handleCreateMember} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NOM COMPLET *</label>
              <input
                type="text"
                required
                placeholder="Ex: Jean Dupont"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>E-MAIL</label>
              <input
                type="email"
                placeholder="jean@gmail.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>N° DE TÉLÉPHONE</label>
              <input
                type="text"
                placeholder="+33 6 12 34 56 78"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>FACEBOOK (ID / LIEN)</label>
              <input
                type="text"
                placeholder="Ex: facebook.com/jeandupont"
                value={newFacebook}
                onChange={e => setNewFacebook(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'none', border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--gold-gradient)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                {creating ? 'Création...' : 'Générer l\'Accès'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Container */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search + Filters bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Statut :</span>
            {([['all', 'Tous'], ['active', '● Actifs'], ['inactive', '○ Désactivés']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  background: statusFilter === val ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${statusFilter === val ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: statusFilter === val ? '#ffd700' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Range Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Créés depuis :</span>
            {([['all', 'Tous'], ['30d', '30 derniers jours'], ['90d', '90 derniers jours']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDateRangeFilter(val)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  background: dateRangeFilter === val ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${dateRangeFilter === val ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: dateRangeFilter === val ? '#ffd700' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filteredMembers.length} / {totalMembers} membre(s)
            </span>
          </div>
        </div>


        {/* Loading / Error States */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--gold-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chargement des comptes clients...</span>
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={20} style={{ color: '#ef4444' }} />
            <span style={{ color: '#fca5a5', fontSize: '0.88rem' }}>{error}</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Aucun membre enregistré.
          </div>
        ) : (
          /* Members list table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('fullName')}>
                    Client <SortIcon col="fullName" />
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Contacts &amp; Réseaux</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Code d'accès unique</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('isActive')}>
                    Statut <SortIcon col="isActive" />
                  </th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('createdAt')}>
                    Créé le <SortIcon col="createdAt" />
                  </th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('lastLoginAt')}>
                    Dernière connexion <SortIcon col="lastLoginAt" />
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => {
                  const isVisible = !!visibleCodes[member.id];

                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', verticalAlign: 'middle' }}>
                      {/* Name */}
                      <td
                        onClick={() => setSelectedMemberId(member.id)}
                        style={{ padding: '1rem 0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {member.profilePhoto ? (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `url(${member.profilePhoto}) center/cover`,
                                border: '2px solid rgba(212, 175, 55, 0.3)',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.1rem' }}>{member.role === 'admin' ? '🛡️' : '👤'}</span>
                          )}
                          <div>
                            <div>{member.fullName}</div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{member.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contacts & Social */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                          {member.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.facebook && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                              <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>{member.facebook}</span>
                            </div>
                          )}
                          {!member.email && !member.phone && !member.facebook && (
                            <span style={{ color: 'var(--text-muted)' }}>Aucun contact</span>
                          )}
                        </div>
                      </td>

                      {/* Code d'accès unique */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: '0.05em', color: isVisible ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                            {isVisible ? member.accessCode : '••••-••••-••••-••••'}
                          </span>
                          <button
                            onClick={() => toggleCodeVisibility(member.id)}
                            title={isVisible ? 'Masquer le code' : 'Afficher le code'}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(member.accessCode)}
                            title="Copier le code"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                          >
                            <Copy size={14} />
                          </button>
                          {member.role !== 'admin' && (
                            <button
                              onClick={() => handleRegenerateCode(member.id)}
                              title="Régénérer un nouveau code"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleActive(member.id, member.isActive)}
                          disabled={member.role === 'admin'}
                          style={{
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '8px',
                            background: member.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: member.isActive ? '#10b981' : '#ef4444',
                            cursor: member.role === 'admin' ? 'default' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {member.isActive ? 'Actif' : 'Désactivé'}
                        </button>
                      </td>

                      {/* Created date */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          <span>{formatDate(member.createdAt)}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDateWithYear(member.lastLoginAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          title="Supprimer définitivement"
                          disabled={member.role === 'admin'}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: member.role === 'admin' ? 'rgba(255,255,255,0.05)' : '#94a3b8',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: member.role === 'admin' ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => { if (member.role !== 'admin') e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { if (member.role !== 'admin') e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalMembers > 50 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 0' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: currentPage === 1 ? 'var(--text-muted)' : '#ffd700',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
              Page {currentPage} / {Math.ceil(totalMembers / 50)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalMembers / 50), prev + 1))}
              disabled={currentPage >= Math.ceil(totalMembers / 50)}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage >= Math.ceil(totalMembers / 50) ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: currentPage >= Math.ceil(totalMembers / 50) ? 'var(--text-muted)' : '#ffd700',
                cursor: currentPage >= Math.ceil(totalMembers / 50) ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  </>
  );
};
