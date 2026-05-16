import { useState } from 'react';
import { validateId } from '../utils/api';
import { LANGS, T } from '../utils/i18n';

export default function LoginScreen({ onLogin, lang, onLangChange }) {
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = T[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    if (id.length !== 4) { setError(t.errLen); return; }
    setLoading(true);
    setError('');
    setAlreadyVoted(false);
    try {
      const res = await validateId(id.toUpperCase());
      if (res.valid) {
        onLogin(id.toUpperCase());
      } else if (res.reason === 'voting ended') {
        setError(t.errVotingEnded || '投票已結束，感謝參與！');
      } else if (res.reason === 'already voted') {
        setAlreadyVoted(true);
        setError(t.errVoted);
      } else {
        setError(t.errNotFound);
      }
    } catch {
      setError(t.errConn);
    }
    setLoading(false);
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', gap: 28 }}>
      <div className="stars-bg" />

      {/* 語言選擇 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => { onLangChange(l.code); setError(''); }}
            className="btn-pixel"
            style={{
              fontSize: 9,
              padding: '6px 10px',
              background: lang === l.code ? '#ffd700' : '#1a1a2e',
              color: lang === l.code ? '#1a1a2e' : '#888',
              border: `2px solid ${lang === l.code ? '#ffd700' : '#4a4a6a'}`,
              boxShadow: lang === l.code ? '0 2px 0 #b8860b' : '0 2px 0 #0a0a1a',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 9, color: '#888', letterSpacing: 3, marginBottom: 10 }}>{t.festival}</div>
        <h1 className="title-glow" style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {t.title}
        </h1>
        <div style={{ marginTop: 10, fontSize: 9, color: '#666' }}>
          <span style={{ color: '#e63946' }}>▐▌</span>
          {' '}{t.vs.split('▐▌')[0].trim()}
          {' '}
          <span style={{ color: '#e63946' }}>▐▌</span>
          {' VS '}
          <span style={{ color: '#a8dadc' }}>▐▌</span>
          {' '}
          {t.vs.split('▐▌').pop().trim()}
          {' '}
          <span style={{ color: '#a8dadc' }}>▐▌</span>
        </div>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <div className="pixel-box" style={{ padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#888', marginBottom: 16, letterSpacing: 2 }}>{t.enterLabel}</div>
          <input
            className="input-pixel"
            maxLength={4}
            value={id}
            onChange={e => { setId(e.target.value.toUpperCase()); setError(''); }}
            placeholder={t.placeholder}
            autoFocus
          />
          {error && (
            <div
              style={{ marginTop: 12, fontSize: 9, color: alreadyVoted ? '#ffd700' : '#e63946', letterSpacing: 1 }}
              className="shake"
            >
              {alreadyVoted ? '✓' : '✗'} {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-pixel btn-gold"
          disabled={loading || id.length < 1}
          style={{ width: '100%', maxWidth: 240 }}
        >
          {loading ? t.verifying : t.confirm}
        </button>
      </form>

      <div style={{ fontSize: 8, color: '#333', letterSpacing: 1, position: 'relative', zIndex: 1 }}>{t.footer}</div>
    </div>
  );
}
