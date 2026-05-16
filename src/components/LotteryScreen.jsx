import { useState, useEffect, useRef } from 'react';
import { getVoters, recordWinner } from '../utils/api';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

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
        fontSize: 52, color, fontFamily: 'monospace',
        textShadow: locked ? `0 0 20px ${color}` : 'none',
        transition: 'color 0.2s',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function LotteryScreen() {
  const [phase, setPhase] = useState('loading'); // loading | ready | spinning | show-winner
  const [voters, setVoters] = useState([]);
  const [winners, setWinners] = useState([]); // 累積得獎名單
  const [currentWinner, setCurrentWinner] = useState(null);
  const [cells, setCells] = useState(['?', '?', '?', '?']);
  const [lockedCount, setLockedCount] = useState(0);
  const [error, setError] = useState('');
  const timersRef = useRef([]);
  const phaseRef = useRef('loading');

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => { loadVoters(); }, []);

  // 偵測後台「抽出一個」
  useEffect(() => {
    function checkDraw() {
      const val = localStorage.getItem('lottery_draw');
      if (val && (phaseRef.current === 'ready' || phaseRef.current === 'show-winner')) {
        localStorage.removeItem('lottery_draw');
        drawOne();
      }
    }
    window.addEventListener('storage', checkDraw);
    return () => window.removeEventListener('storage', checkDraw);
  }, [voters, winners]);

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

  function drawOne() {
    const wonIds = JSON.parse(localStorage.getItem('lottery_winners') || '[]');
    const pool = voters.filter(v => !wonIds.includes(v.id));
    if (pool.length === 0) return;

    const winner = pool[Math.floor(Math.random() * pool.length)];
    setCurrentWinner(winner);
    setCells(['?', '?', '?', '?']);
    setLockedCount(0);
    setPhase('spinning');
    spinCells(winner);
  }

  function spinCells(winner) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const targetChars = winner.id.split('');
    const locked = [false, false, false, false];
    let currentCells = ['?', '?', '?', '?'];

    function tickCell(colIdx) {
      if (locked[colIdx]) return;
      currentCells = [...currentCells];
      currentCells[colIdx] = randomChar();
      setCells([...currentCells]);
      const t = setTimeout(() => tickCell(colIdx), 60);
      timersRef.current.push(t);
    }

    for (let i = 0; i < 4; i++) tickCell(i);

    const lockDelays = [1200, 2000, 2800, 3600];
    lockDelays.forEach((delay, colIdx) => {
      const t = setTimeout(() => {
        locked[colIdx] = true;
        currentCells = [...currentCells];
        currentCells[colIdx] = targetChars[colIdx];
        setCells([...currentCells]);
        setLockedCount(colIdx + 1);

        if (colIdx === 3) {
          const wonIds = JSON.parse(localStorage.getItem('lottery_winners') || '[]');
          wonIds.push(winner.id);
          localStorage.setItem('lottery_winners', JSON.stringify(wonIds));
          setWinners(prev => [...prev, winner]);
          recordWinner(winner.id, winner.choice);
          setTimeout(() => setPhase('show-winner'), 400);
        }
      }, delay);
      timersRef.current.push(t);
    });
  }

  const isRed = currentWinner?.choice === 'red';
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
                ? <>共 <span style={{ color: '#fff' }}>{voters.length}</span> 人參與</>
                : phase === 'show-winner'
                ? <>第 <span style={{ color: '#ffd700' }}>{winners.length}</span> 位得獎者</>
                : <>抽獎中...</>
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
                等待後台抽獎...
              </div>
            )}

            {phase === 'show-winner' && (
              <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ color: winnerColor, fontSize: 20, letterSpacing: 4 }}>🎉 恭喜得獎！</div>
                <div style={{ color: winnerColor, fontSize: 13, letterSpacing: 2 }}>
                  {currentWinner?.choice === 'red' ? '🔴 紅湯支持者' : '⚪ 白湯支持者'}
                </div>
              </div>
            )}
          </>
        )}

        {/* 累積得獎名單 */}
        {winners.length > 0 && (
          <div style={{ marginTop: 40, minWidth: 340 }}>
            <div style={{ color: '#555', fontSize: 11, letterSpacing: 3, marginBottom: 12 }}>🏆 得獎名單</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {winners.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: '#0d0d1a', border: `2px solid ${w.choice === 'red' ? '#e63946' : '#a8dadc'}`,
                  padding: '10px 20px',
                }}>
                  <span style={{ color: '#555', fontSize: 11 }}>#{i + 1}</span>
                  <span style={{ color: '#fff', fontSize: 22, letterSpacing: 4, flex: 1 }}>{w.id}</span>
                  <span style={{ fontSize: 11, color: w.choice === 'red' ? '#e63946' : '#a8dadc' }}>
                    {w.choice === 'red' ? '🔴 紅湯' : '⚪ 白湯'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
