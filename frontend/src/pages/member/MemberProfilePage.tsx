import React, { useState } from 'react';
import { User, Mail, Phone, Globe, Key, Copy, CheckCircle, Shield, Clock, Camera, Save, X } from 'lucide-react';

interface MemberProfilePageProps {
  currentMember: { id: string; fullName: string; role: string; email?: string; phone?: string; facebook?: string; accessCode?: string; createdAt?: string; profilePhoto?: string };
  onUpdateMember?: (updates: { fullName?: string; email?: string; phone?: string; facebook?: string; profilePhoto?: string }) => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ color: '#ffd700', marginTop: '0.1rem', flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Non renseigné'}
      </div>
    </div>
  </div>
);

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({ currentMember, onUpdateMember }) => {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentMember.profilePhoto || null);
  
  const [formData, setFormData] = useState({
    fullName: currentMember.fullName,
    email: currentMember.email || '',
    phone: currentMember.phone || '',
    facebook: currentMember.facebook || '',
  });

  const handleCopy = () => {
    if (!currentMember.accessCode) return;
    navigator.clipboard.writeText(currentMember.accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image trop lourde (max 5 MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onUpdateMember) {
      onUpdateMember({
        ...formData,
        profilePhoto: previewPhoto || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      fullName: currentMember.fullName,
      email: currentMember.email || '',
      phone: currentMember.phone || '',
      facebook: currentMember.facebook || '',
    });
    setPreviewPhoto(currentMember.profilePhoto || null);
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 640 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Mon Profil</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Vos informations personnelles</p>
      </div>

      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.75rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.07) 0%, rgba(255,215,0,0.02) 100%)', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.15)' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div 
            style={{ 
              width: 72, 
              height: 72, 
              borderRadius: '50%', 
              background: previewPhoto 
                ? `url(${previewPhoto}) center/cover` 
                : 'rgba(255,215,0,0.12)', 
              border: '2px solid rgba(255,215,0,0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: '#ffd700',
              overflow: 'hidden'
            }}
          >
            {!previewPhoto && currentMember.fullName.charAt(0).toUpperCase()}
          </div>
          <label 
            htmlFor="profile-photo-upload"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--gold-gradient)',
              border: '2px solid var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#000'
            }}
            title="Changer la photo"
          >
            <Camera size={14} />
          </label>
          <input
            id="profile-photo-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                width: '100%',
                marginBottom: '0.4rem'
              }}
            />
          ) : (
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentMember.fullName}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
            <Shield size={12} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Membre</span>
          </div>
          {currentMember.createdAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <Clock size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Membre depuis le {new Date(currentMember.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--gold-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem'
                }}
              >
                <Save size={14} />
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem'
                }}
              >
                <X size={14} />
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
                color: '#ffd700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={14} /> Informations personnelles
        </div>
        
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Nom complet</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Adresse e-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Facebook / Réseaux</label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <InfoRow icon={<User size={16} />} label="Nom complet" value={currentMember.fullName} />
            <InfoRow icon={<Mail size={16} />} label="Adresse e-mail" value={currentMember.email} />
            <InfoRow icon={<Phone size={16} />} label="Téléphone" value={currentMember.phone} />
            <InfoRow icon={<Globe size={16} />} label="Facebook / Réseaux" value={currentMember.facebook} />
          </>
        )}
      </div>

      {/* Access Code */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.12)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={14} /> Code d'accès
        </div>
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,215,0,0.04)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.15)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          ⚠️ Ne partagez jamais votre code d'accès. Il vous permet de vous connecter à votre espace personnel.
        </div>
        {currentMember.accessCode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '0.12em', color: showCode ? '#ffd700' : 'transparent', textShadow: showCode ? 'none' : '0 0 8px rgba(255,215,0,0.8)', background: 'rgba(255,215,0,0.05)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.15)', userSelect: showCode ? 'text' : 'none' }}>
              {currentMember.accessCode}
            </div>
            <button onClick={() => setShowCode(v => !v)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {showCode ? 'Masquer' : 'Afficher'}
            </button>
            <button onClick={handleCopy} style={{ background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(255,215,0,0.08)', border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'rgba(255,215,0,0.2)'}`, borderRadius: '8px', padding: '0.6rem 0.75rem', color: copied ? '#00e676' : '#ffd700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Code non disponible. Contactez l'administrateur.</div>
        )}
      </div>
    </div>
  );
};
