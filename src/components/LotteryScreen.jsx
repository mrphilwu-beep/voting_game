import { useState, useEffect, useRef } from 'react';
import { getVoters } from '../utils/api';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

// 單一格子
function SlotCell({ value, locked, winnerColor }) {
  const color = locked ? (winnerColor || '#ffd700') : '#ffd700';
  return (
    <div style={{
      width: 80, height: 100,
      border: `3px solid ${locked ? color : '#444'}`,
      background: locked ? '#0d0d1a' : '#070710',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: locked ? `0 0 24px ${color}88` : 'none',
      transition: 'border-color 0.2s, box-shadow 0.3s',
    }}>
      <span style={{
        fontSize: 52, color, fontFamily: 'monospace', letterSpacing: 0,
        textShadow: locked ? `0 0 20px ${color}` : 'none',
        transition: 'color 0.2s',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function LotteryScreen({ count, onClose }) {
  const [phase, setPhase] = useState('loading');
  const [voters, setVoters] = useState([]);
  const [winners, setWinners] = useState([]);
  const [currentWinnerIdx, setCurrentWinnerIdx] = useState(0);
  const [cells, setCells] = useState(['?', '?', '?', '?']);
  const [lockedCount, setLockedCount] = useState(0); // 0~4 已鎖定的格數
  const [error, setError] = useState('');
  const timersRef = useRef([]);

  useEffect(() => { loadVoters(); }, []);

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

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

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
    setLockedCount(0);
    setCells(['?', '?', '?', '?']);
    setPhase('spinning');
    spinOne(picked, 0);
  }

  function spinOne(allWinners, idx) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const winner = allWinners[idx];
    const targetChars = winner.id.split('');
    const locked = [false, false, false, false];
    let currentCells = ['?', '?', '?', '?'];

    // 每個格子的旋轉 ticker
    const intervals = [null, null, null, null];
    const speeds = [60, 60, 60, 60];

    function tickCell(colIdx) {
      if (locked[colIdx]) return;
      currentCells = [...currentCells];
      currentCells[colIdx] = randomChar();
      setCells([...currentCells]);
      intervals[colIdx] = setTimeout(() => tickCell(colIdx), speeds[colIdx]);
      timersRef.current.push(intervals[colIdx]);
    }

    // 啟動全部格子
    for (let i = 0; i < 4; i++) tickCell(i);

    // 依序鎖定每個格子
    const lockDelays = [1200, 2000, 2800, 3600];
    lockDelays.forEach((delay, colIdx) => {
      const t = setTimeout(() => {
        locked[colIdx] = true;
        currentCells = [...currentCells];
        currentCells[colIdx] = targetChars[colIdx];
        setCells([...currentCells]);
        setLockedCount(colIdx + 1);

        // 最後一格鎖定後進入 show-winner
        if (colIdx === 3) {
          setTimeout(() => setPhase('show-winner'), 400);
        }
      }, delay);
      timersRef.current.push(t);
    });
  }

  function nextWinner() {
    const nextIdx = currentWinnerIdx + 1;
    setCurrentWinnerIdx(nextIdx);
    setLockedCount(0);
    setCells(['?', '?', '?', '?']);
    setPhase('spinning');
    spinOne(winners, nextIdx);
  }

  const winner = winners[currentWinnerIdx];
  const isRed = phase === 'show-winner' && winner?.choice === 'red';
  const winnerColor = isRed ? '#e63946' : '#a8dadc';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#03030a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, fontFamily: 'monospace',
    }}>
      <div className="stars-bg" />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#ffd700', fontSize: 14, letterSpacing: 8, marginBottom: 8 }}>◆ 2025 牛肉麵節 ◆</div>
        <div style={{ color: '#fff', fontSize: 36, letterSpacing: 8 }}>幸運抽獎</div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

        {phase === 'loading' && (
          <div style={{ color: '#555', fontSize: 16, letterSpacing: 4 }}>載入中...</div>
        )}

        {phase === 'ready' && error && (
          <div style={{ color: '#e63946', fontSize: 14 }}>{error}</div>
        )}

        {(phase === 'ready' || phase === 'spinning' || phase === 'show-winner') && !error && (
          <>
            <div style={{ color: '#555', fontSize: 12, letterSpacing: 3, marginBottom: 24 }}>
              {phase === 'ready'
                ? <>共 <span style={{ color: '#fff' }}>{voters.length}</span> 人參與，抽出 <span style={{ color: '#ffd700' }}>{Math.min(count, voters.length)}</span> 名得獎者</>
                : <>第 {currentWinnerIdx + 1} / {winners.length} 名</>
              }
            </div>

            {/* 4 格拉霸 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
              {cells.map((ch, i) => (
                <SlotCell
                  key={i}
                  value={ch}
                  locked={phase === 'spinning' ? i < lockedCount : phase === 'show-winner'}
                  winnerColor={phase === 'show-winner' ? winnerColor : undefined}
                />
              ))}
            </div>

            {phase === 'ready' && (
              <div style={{ color: '#ffd700', fontSize: 13, letterSpacing: 4 }} className="blink">
                等待後台啟動...
              </div>
            )}

            {phase === 'show-winner' && (
              <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ color: winnerColor, fontSize: 20, letterSpacing: 4 }}>🎉 恭喜得獎！</div>
                <div style={{ color: winnerColor, fontSize: 13, letterSpacing: 2 }}>
                  {winner?.choice === 'red' ? '🔴 紅湯支持者' : '⚪ 白湯支持者'}
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

      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 24, right: 24, fontFamily: 'monospace', fontSize: 11, background: 'transparent', border: '1px solid #333', color: '#555', padding: '6px 14px', cursor: 'pointer', zIndex: 101 }}
      >
        ✕ 關閉
      </button>
    </div>
  );
}
