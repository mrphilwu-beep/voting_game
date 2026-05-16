import { useState, useEffect } from 'react';
import { getResults, resetVotes, endVoting } from '../utils/api';

export default function AdminPanel() {
  const [results, setResults] = useState({ red: 0, white: 0, total: 0 });
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const [lotteryReady, setLotteryReady] = useState(
    () => localStorage.getItem('lottery_mode') === '1'
  );
  const [votingEnded, setVotingEnded] = useState(
    () => localStorage.getItem('voting_ended') === '1'
  );

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, 5000);
    return () => clearInterval(id);
  }, []);

  async function doFetch() {
    try {
      const data = await getResults(1);
      setResults(data);
      setReady(true);
    } catch {}
  }

  async function handleReset() {
    if (!password) return;
    setResetting(true);
    try {
      const result = await resetVotes(password);
      if (result.success) {
        setResults({ red: 0, white: 0, total: 0 });
        setPassword('');
        setResetMsg('✓ 投票已重置');
        localStorage.removeItem('lottery_mode');
        localStorage.removeItem('lottery_winners');
        localStorage.removeItem('voting_ended');
        localStorage.setItem('reset_trigger', Date.now().toString());
        setLotteryReady(false);
        setVotingEnded(false);
      } else {
        setResetMsg('✗ 密碼錯誤');
      }
    } catch {
      setResetMsg('✗ 連線失敗');
    }
    setResetting(false);
    setTimeout(() => setResetMsg(''), 3000);
  }

  const redPct = results.total > 0 ? Math.round(results.red / results.total * 100) : 0;
  const whitePct = results.total > 0 ? Math.round(results.white / results.total * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#03030a', color: '#fff', fontFamily: 'monospace', padding: 40, boxSizing: 'border-box' }}>
      <div className="stars-bg" />
      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: '#ffd700', fontSize: 13, letterSpacing: 6, marginBottom: 8 }}>◆ 2025 牛肉麵節 ◆</div>
          <div style={{ color: '#fff', fontSize: 28, letterSpacing: 6 }}>後台管理</div>
        </div>

        {/* 票數概覽 */}
        <div className="pixel-box" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ color: '#ffd700', fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>目前票數</div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#1a0808', border: '2px solid #e63946', padding: 16, textAlign: 'center' }}>
              <div style={{ color: '#e63946', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>🔴 紅湯</div>
              <div style={{ color: '#e63946', fontSize: 48 }}>{ready ? results.red : '—'}</div>
              <div style={{ color: '#e63946', fontSize: 11, marginTop: 4 }}>{ready ? `${redPct}%` : ''}</div>
            </div>
            <div style={{ flex: 1, background: '#081a1a', border: '2px solid #a8dadc', padding: 16, textAlign: 'center' }}>
              <div style={{ color: '#a8dadc', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>⚪ 白湯</div>
              <div style={{ color: '#a8dadc', fontSize: 48 }}>{ready ? results.white : '—'}</div>
              <div style={{ color: '#a8dadc', fontSize: 11, marginTop: 4 }}>{ready ? `${whitePct}%` : ''}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#888', fontSize: 12, letterSpacing: 2 }}>
            總票數：<span style={{ color: '#fff' }}>{ready ? results.total : '—'}</span>
          </div>

          {/* 長條 */}
          {ready && results.total > 0 && (
            <div style={{ marginTop: 16, height: 12, background: '#111', border: '1px solid #333', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${redPct}%`, background: '#e63946', transition: 'width 0.5s' }} />
              <div style={{ flex: 1, background: '#a8dadc', transition: 'width 0.5s' }} />
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="pixel-box" style={{ padding: 24 }}>
          <div style={{ color: '#ffd700', fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>重置投票</div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 16 }}>
            重置後所有投票記錄將清除，所有人可重新投票。
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="password"
              placeholder="輸入密碼"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, background: '#0a0a1a', border: '2px solid #333', color: '#fff', padding: '10px 14px' }}
            />
            <button
              onClick={handleReset}
              disabled={resetting || !password}
              className="btn-pixel btn-red"
              style={{ fontSize: 11, padding: '10px 20px', opacity: !password ? 0.4 : 1 }}
            >
              {resetting ? '處理中...' : 'RESET'}
            </button>
          </div>
          {resetMsg && (
            <div style={{ marginTop: 12, fontSize: 12, color: resetMsg.startsWith('✓') ? '#4caf50' : '#e63946' }}>
              {resetMsg}
            </div>
          )}
        </div>

        {/* 抽獎 */}
        <div className="pixel-box" style={{ padding: 24, marginTop: 24 }}>
          <div style={{ color: '#ffd700', fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>幸運抽獎</div>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 16 }}>
            每按一次抽出一位，已中獎者不重複。
          </div>
          <button
            className="btn-pixel btn-gold"
            style={{ fontSize: 13, padding: '12px 32px', width: '100%', marginBottom: lotteryReady ? 12 : 0 }}
            disabled={votingEnded}
            onClick={async () => {
              await endVoting();
              localStorage.setItem('voting_ended', '1');
              localStorage.setItem('lottery_trigger', '1');
              localStorage.setItem('lottery_mode', '1');
              localStorage.removeItem('lottery_winners');
              window.open('/results', '_blank');
              setVotingEnded(true);
              setLotteryReady(true);
            }}
          >
            {votingEnded ? '✓ 已結束投票' : '🔒 結束投票'}
          </button>
          {lotteryReady && (
            <button
              className="btn-pixel btn-red"
              style={{ fontSize: 14, padding: '14px 32px', width: '100%', letterSpacing: 4 }}
              onClick={() => {
                localStorage.setItem('lottery_draw', Date.now().toString());
              }}
            >
              🎲 抽出一個
            </button>
          )}
        </div>

        {/* 連結 */}
        <div style={{ marginTop: 32, color: '#333', fontSize: 11, textAlign: 'center', lineHeight: 2 }}>
          <a href="/" style={{ color: '#555', textDecoration: 'none' }}>投票遊戲</a>
          {'  ·  '}
          <a href="/results" style={{ color: '#555', textDecoration: 'none' }}>投票結果</a>
        </div>
      </div>

    </div>
  );
}
