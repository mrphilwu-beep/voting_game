import { useState, useEffect, useRef } from 'react';
import { getResults } from '../utils/api';
import LotteryScreen from './LotteryScreen';

const BASE_W = 1280;
const BASE_H = 720;
const MAX_BLOCKS = 30;
const BLOCK_PX = 16;
const BLOCK_W = 44;

function SideBar({ count, side, burst, ready }) {
  const isRed = side === 'red';
  const blocks = Math.min(count, MAX_BLOCKS);
  const colorA = isRed ? '#e63946' : '#a8dadc';
  const colorB = isRed ? '#ff6b6b' : '#f1faee';
  const emptyColor = isRed ? '#2a1010' : '#0e1e22';
  const burstClass = burst ? (isRed ? 'vote-burst-red' : 'vote-burst-white') : '';

  return (
    <div className={burstClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: BLOCK_W + 40, borderRadius: 4, padding: 8 }}>
      <div
        key={burst ? count : undefined}
        className={burst ? 'count-pop' : ''}
        style={{ fontSize: 64, color: colorA, marginBottom: 16, fontFamily: 'monospace', textShadow: `0 0 30px ${colorA}` }}
      >
        {ready ? count : '—'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: MAX_BLOCKS * BLOCK_PX, gap: 2 }}>
        {Array.from({ length: MAX_BLOCKS }).map((_, i) => {
          const filled = i >= MAX_BLOCKS - blocks;
          const isTop = i === MAX_BLOCKS - blocks;
          return (
            <div
              key={i}
              style={{
                width: BLOCK_W,
                height: BLOCK_PX - 2,
                background: filled ? (i % 2 === 0 ? colorA : colorB) : emptyColor,
                boxShadow: filled && isTop ? `0 0 16px ${colorA}` : 'none',
                transition: 'background 0.3s',
              }}
            />
          );
        })}
      </div>
      <div style={{ height: 5, width: BLOCK_W, background: colorA, marginTop: 5 }} />
      <div style={{ fontSize: 20, color: colorA, marginTop: 10, letterSpacing: 4, fontFamily: 'monospace' }}>
        {isRed ? '🔴 RED' : '⚪ WHITE'}
      </div>
    </div>
  );
}

export default function ResultsDisplay({ width, height }) {
  const [results, setResults] = useState({ red: 0, white: 0, total: 0 });
  const [ready, setReady] = useState(false);
  const [burst, setBurst] = useState({ red: false, white: false });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lotteryCount, setLotteryCount] = useState(null);
  const prevRef = useRef({ red: 0, white: 0 });

  // 偵測後台觸發抽獎
  useEffect(() => {
    function checkLottery() {
      const val = localStorage.getItem('lottery_trigger');
      if (val) {
        localStorage.removeItem('lottery_trigger');
        setLotteryCount(parseInt(val) || 1);
      }
    }
    checkLottery();
    window.addEventListener('storage', checkLottery);
    return () => window.removeEventListener('storage', checkLottery);
  }, []);

  const w = width ?? window.innerWidth;
  const h = height ?? window.innerHeight;
  const scale = Math.min(w / BASE_W, h / BASE_H);

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, 4000);
    return () => clearInterval(id);
  }, []);

  async function doFetch() {
    try {
      const data = await getResults(1);
      const prev = prevRef.current;
      const redUp = data.red > prev.red;
      const whiteUp = data.white > prev.white;
      if (redUp || whiteUp) {
        setBurst({ red: redUp, white: whiteUp });
        setTimeout(() => setBurst({ red: false, white: false }), 900);
      }
      prevRef.current = { red: data.red, white: data.white };
      setResults(data);
      setReady(true);
      setLastUpdated(new Date().toLocaleTimeString('zh-TW'));
    } catch {}
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#03030a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="stars-bg" />
      {lotteryCount !== null && (
        <LotteryScreen count={lotteryCount} onClose={() => setLotteryCount(null)} />
      )}
      <div style={{
        width: BASE_W, height: BASE_H,
        transformOrigin: 'center center',
        transform: `scale(${scale})`,
        display: 'flex', flexDirection: 'column',
        padding: '40px 80px', boxSizing: 'border-box',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
          <div style={{ fontFamily: 'monospace', color: '#ffd700', fontSize: 14, letterSpacing: 8, marginBottom: 8 }}>
            ◆ 2025 牛肉麵節 ◆
          </div>
          <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: 48, letterSpacing: 10, textShadow: '0 0 40px #ffd70088' }}>
            即時投票結果
          </div>
          <div style={{ fontFamily: 'monospace', color: '#555', fontSize: 12, marginTop: 12, letterSpacing: 2 }}>
            🔴 紅湯 VS 白湯 ⚪
            {lastUpdated && <span style={{ marginLeft: 24 }}>最後更新 {lastUpdated}</span>}
          </div>

        </div>

        {/* Bars */}
        <div style={{ flex: 1, display: 'flex', gap: 80, alignItems: 'flex-end', justifyContent: 'center' }}>
          <SideBar count={results.red} side="red" burst={burst.red} ready={ready} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 40 }}>
            <div style={{ fontFamily: 'monospace', color: '#333', fontSize: 56 }}>VS</div>
            <div style={{ fontFamily: 'monospace', color: '#555', fontSize: 16, letterSpacing: 2 }}>TOTAL</div>
            <div style={{ fontFamily: 'monospace', color: '#fff', fontSize: 40 }}>{ready ? results.total : '—'}</div>
          </div>
          <SideBar count={results.white} side="white" burst={burst.white} ready={ready} />
        </div>
      </div>
    </div>
  );
}
