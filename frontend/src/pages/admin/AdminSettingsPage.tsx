import React, { useState } from 'react';
import { Shield, Palette, Lock, Save, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface AdminSettingsPageProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  currentMember: { id: string; fullName: string; role: string };
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.1)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#ffd700' }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
  fontSize: '0.9rem', width: '100%', outline: 'none', transition: 'border-color 0.2s',
};

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ apiFetch, currentMember }) => {
  // App settings (local for now — could be persisted)
  const [appName, setAppName] = useState(() => localStorage.getItem('app_name') || 'Mentor Or');
  const [appSubtitle, setAppSubtitle] = useState(() => localStorage.getItem('app_subtitle') || 'XAU/USD Trading Journal');
  const [savedApp, setSavedApp] = useState(false);

  // Code change
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSaved, setCodeSaved] = useState(false);

  const handleSaveApp = () => {
    localStorage.setItem('app_name', appName);
    localStorage.setItem('app_subtitle', appSubtitle);
    setSavedApp(true);
    setTimeout(() => setSavedApp(false), 2500);
  };

  const handleChangeCode = async () => {
    setCodeError(null);
    if (!newCode.trim()) { setCodeError('Le nouveau code ne peut pas être vide.'); return; }
    if (newCode !== confirmCode) { setCodeError('Les deux codes ne correspondent pas.'); return; }
    if (newCode.length < 8) { setCodeError('Le code doit contenir au moins 8 caractères.'); return; }

    setCodeLoading(true);
    try {
      const r = await apiFetch(`/api/members/${currentMember.id}/regenerate-code`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: newCode }),
      });
      if (r.ok) {
        setCodeSaved(true);
        setNewCode('');
        setConfirmCode('');
        setTimeout(() => setCodeSaved(false), 3000);
      } else {
        const body = await r.json().catch(() => ({}));
        setCodeError(body.message || 'Erreur lors de la régénération du code.');
      }
    } catch {
      setCodeError('Impossible de contacter le serveur.');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Paramètres</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Configuration de la plateforme</p>
      </div>

      {/* App Identity */}
      <Section title="Identité de l'application" icon={<Palette size={20} />}>
        <Field label="Nom de l'application">
          <input style={inputStyle} value={appName} onChange={e => setAppName(e.target.value)}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <Field label="Sous-titre / Slogan">
          <input style={inputStyle} value={appSubtitle} onChange={e => setAppSubtitle(e.target.value)}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <button
          onClick={handleSaveApp}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: savedApp ? 'rgba(0,230,118,0.15)' : 'rgba(255,215,0,0.1)', border: `1px solid ${savedApp ? '#00e676' : 'rgba(255,215,0,0.3)'}`, borderRadius: '10px', padding: '0.75rem 1.5rem', color: savedApp ? '#00e676' : '#ffd700', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s', alignSelf: 'flex-start' }}
        >
          {savedApp ? <CheckCircle size={16} /> : <Save size={16} />}
          {savedApp ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </Section>

      {/* Security */}
      <Section title="Sécurité — Code d'accès Admin" icon={<Shield size={20} />}>
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,215,0,0.05)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.15)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: '#ffd700' }}>ℹ️ Information :</strong> Régénérer votre code d'accès admin invalidera immédiatement l'ancien code. Assurez-vous de noter le nouveau code avant de vous déconnecter.
        </div>
        <Field label="Nouveau code d'accès">
          <div style={{ position: 'relative' }}>
            <input
              type={showCode ? 'text' : 'password'}
              style={{ ...inputStyle, paddingRight: '2.75rem' }}
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="Nouveau code d'accès…"
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button onClick={() => setShowCode(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <Field label="Confirmer le code">
          <input
            type={showCode ? 'text' : 'password'}
            style={inputStyle}
            value={confirmCode}
            onChange={e => setConfirmCode(e.target.value)}
            placeholder="Confirmer le nouveau code…"
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        {codeError && <div style={{ color: '#ef4444', fontSize: '0.82rem', background: 'rgba(239,68,68,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>{codeError}</div>}
        {codeSaved && <div style={{ color: '#00e676', fontSize: '0.82rem', background: 'rgba(0,230,118,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.3)' }}>✅ Code régénéré avec succès. Notez votre nouveau code !</div>}
        <button
          onClick={handleChangeCode}
          disabled={codeLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '10px', padding: '0.75rem 1.5rem', color: '#ffd700', cursor: codeLoading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: codeLoading ? 0.6 : 1, transition: 'all 0.2s', alignSelf: 'flex-start' }}
        >
          {codeLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Lock size={16} />}
          {codeLoading ? 'Régénération…' : 'Régénérer le code'}
        </button>
      </Section>


    </div>
  );
};
