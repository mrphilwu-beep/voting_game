import { useState, useEffect, useRef } from 'react';
import { getVoters } from '../utils/api';

export default function LotteryScreen({ count, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | spinning | done
  const [voters, setVoters] = useState([]);
  const [winners, setWinners] = useState([]);
  const [currentWinnerIdx, setCurrentWinnerIdx] = useState(0);
  const [displayId, setDisplayId] = useState('????');
  const [error, setError] = useState('');
  const spinRef = useRef(null);

  useEffect(() => {
    loadVoters();
  }, []);

  // 偵測後台按下啟動
  useEffect(() => {
    function checkStart() {
      const val = localStorage.getItem('lottery_start');
      if (val) {
        localStorage.removeItem('lottery_start');
        if (phase === 'ready') startDraw();
      }
    }
    window.addEventListener('storage', checkStart);
    return () => window.removeEventListener('storage', checkStart);
  }, [phase, voters]);

  async function loadVoters() {
    try {
      const data = await getVoters();
      if (!data.voters || data.voters.length === 0) {
        setError('目前沒有投票記錄');
        setPhase('ready');
        return;
      }
      setVoters(data.voters);
      setPhase('ready');
    } catch {
      setError('無法載入投票資料');
      setPhase('ready');
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startDraw() {
    if (voters.length === 0) return;
    const actualCount = Math.min(count, voters.length);
    const picked = shuffle(voters).slice(0, actualCount);
    setWinners(picked);
    setCurrentWinnerIdx(0);
    setPhase('spinning');
    spinOne(picked, 0);
  }

  function spinOne(allWinners, idx) {
    const winner = allWinners[idx];
    const ids = voters.map(v => v.id);
    let tick = 0;
    const totalTicks = 40 + idx * 10;
    let interval = 50;

    function step() {
      tick++;
      // 隨機顯示一個 ID
      setDisplayId(ids[Math.floor(Math.random() * ids.length)]);

      // 逐漸減速
      if (tick > totalTicks * 0.6) interval = 80;
      if (tick > totalTicks * 0.8) interval = 140;
      if (tick > totalTicks * 0.9) interval = 220;

      if (tick >= totalTicks) {
        setDisplayId(winner.id);
        setPhase('show-winner');
        spinRef.current = null;
      } else {
        spinRef.current = setTimeout(step, interval);
      }
    }
    spinRef.current = setTimeout(step, interval);
  }

  function nextWinner() {
    const nextIdx = currentWinnerIdx + 1;
    if (nextIdx >= winners.length) {
      setPhase('done');
    } else {
      setCurrentWinnerIdx(nextIdx);
      setPhase('spinning');
      spinOne(winners, nextIdx);
    }
  }

  useEffect(() => {
    return () => { if (spinRef.current) clearTimeout(spinRef.current); };
  }, []);

  const isRed = phase === 'show-winner' && winners[currentWinnerIdx]?.choice === 'red';
  const winnerColor = isRed ? '#e63946' : '#a8dadc';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#03030a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, fontFamily: 'monospace',
    }}>
      <div className="stars-bg" />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#ffd700', fontSize: 14, letterSpacing: 8, marginBottom: 8 }}>◆ 2025 牛肉麵節 ◆</div>
        <div style={{ color: '#fff', fontSize: 36, letterSpacing: 8 }}>幸運抽獎</div>
      </div>

      {/* 主體 */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

        {phase === 'loading' && (
          <div style={{ color: '#555', fontSize: 16, letterSpacing: 4 }}>載入中...</div>
        )}

        {phase === 'ready' && error && (
          <div style={{ color: '#e63946', fontSize: 14, marginBottom: 32 }}>{error}</div>
        )}

        {(phase === 'ready' || phase === 'spinning' || phase === 'show-winner') && !error && (
          <>
            <div style={{ color: '#555', fontSize: 12, letterSpacing: 3, marginBottom: 16 }}>
              {phase === 'ready'
                ? <>共 <span style={{ color: '#fff' }}>{voters.length}</span> 人參與，抽出 <span style={{ color: '#ffd700' }}>{Math.min(count, voters.length)}</span> 名得獎者</>
                : <>第 {currentWinnerIdx + 1} / {winners.length} 名</>
              }
            </div>

            {/* 拉霸槽 */}
            <div style={{
              width: 360, height: 120,
              border: `4px solid ${phase === 'show-winner' ? winnerColor : '#ffd700'}`,
              background: '#07071a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 32,
              boxShadow: phase === 'show-winner' ? `0 0 60px ${winnerColor}, 0 0 120px ${winnerColor}44` : '0 0 30px #ffd70044',
              transition: 'box-shadow 0.3s, border-color 0.3s',
            }}>
              <div style={{
                fontSize: 64,
                color: phase === 'show-winner' ? winnerColor : '#ffd700',
                letterSpacing: 8,
                textShadow: `0 0 30px ${phase === 'show-winner' ? winnerColor : '#ffd700'}`,
                transition: 'color 0.2s',
              }}>
                {displayId}
              </div>
            </div>

            {phase === 'ready' && (
              <div style={{ color: '#ffd700', fontSize: 13, letterSpacing: 4 }} className="blink">
                等待後台啟動...
              </div>
            )}

            {phase === 'show-winner' && (
              <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ color: winnerColor, fontSize: 20, letterSpacing: 4 }}>
                  🎉 恭喜得獎！
                </div>
                <div style={{ color: winnerColor, fontSize: 13, letterSpacing: 2 }}>
                  {winners[currentWinnerIdx]?.choice === 'red' ? '🔴 紅湯支持者' : '⚪ 白湯支持者'}
                </div>
                {currentWinnerIdx < winners.length - 1 && (
                  <button className="btn-pixel btn-gold" style={{ fontSize: 13, padding: '12px 32px', marginTop: 8 }} onClick={nextWinner}>
                    ▶ 下一位
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div className="pop-in" style={{ textAlign: 'center' }}>
            <div style={{ color: '#ffd700', fontSize: 24, letterSpacing: 4, marginBottom: 24 }}>🏆 得獎名單</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {winners.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: '#0d0d1a', border: `2px solid ${w.choice === 'red' ? '#e63946' : '#a8dadc'}`,
                  padding: '12px 24px',
                }}>
                  <span style={{ color: '#555', fontSize: 12 }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontSize: 24, letterSpacing: 4, flex: 1 }}>{w.id}</span>
                  <span style={{ fontSize: 12, color: w.choice === 'red' ? '#e63946' : '#a8dadc' }}>
                    {w.choice === 'red' ? '🔴 紅湯' : '⚪ 白湯'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 關閉 */}
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 24, right: 24, fontFamily: 'monospace', fontSize: 11, background: 'transparent', border: '1px solid #333', color: '#555', padding: '6px 14px', cursor: 'pointer', zIndex: 101 }}
      >
        ✕ 關閉
      </button>
    </div>
  );
}
