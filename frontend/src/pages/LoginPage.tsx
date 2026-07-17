import React, { useState } from 'react';
import { Lock, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (member: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim().toUpperCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Code d'accès invalide.");
      }

      onLoginSuccess(data.member, data.sessionToken);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Background radial effects */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.09) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Main glass box container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(14, 18, 30, 0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(212, 175, 55, 0.15)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.05)',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Top Gold Bar Deco */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'var(--gold-gradient)',
          borderRadius: '0 0 4px 4px',
          opacity: 0.8
        }} />

        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.4rem',
            fontWeight: 800,
            background: 'var(--gold-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            letterSpacing: '-0.02em',
            marginBottom: '0.4rem',
            lineHeight: '1.2'
          }}>
            🏆 XAU/USD JOURNAL ELITE
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Espace sécurisé de trading — Accès par code client uniquement
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'start',
            gap: '0.6rem',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '0.1rem' }} />
            <span style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: '1.4' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Code d'Accès Personnel
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                autoFocus
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem 0.85rem 2.75rem',
                  background: 'rgba(197, 160, 89, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  outline: 'none',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--gold-gradient)',
              border: 'none',
              borderRadius: '12px',
              color: '#06070a',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-gold)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.15s ease',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Validation du code...
              </>
            ) : (
              <>
                Accéder à mon espace
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
            Si vous n'avez pas de code, contactez l'administrateur de la plateforme pour obtenir un accès.
          </p>
        </div>
      </div>
    </div>
  );
};
