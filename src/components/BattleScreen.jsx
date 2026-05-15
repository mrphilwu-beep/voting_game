import { useState, useEffect, useRef } from 'react';
import { submitVote, getResults } from '../utils/api';
import { getBossAvatarUrl, BOSS_SEEDS } from '../utils/dicebear';
import { T } from '../utils/i18n';

const BLOCK_PX = 10;
const MAX_BLOCKS = 30; // 每柱最多 30 格，超過後 1 格代表多票

// 單側直條柱
function SideBar({ count, side, ready }) {
  const isRed = side === 'red';
  const blocks = Math.min(count, MAX_BLOCKS);
  const colorA = isRed ? '#e63946' : '#a8dadc';
  const colorB = isRed ? '#ff6b6b' : '#f1faee';
  const emptyColor = isRed ? '#2a1010' : '#0e1e22';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36 }}>
      {/* 票數 */}
      <div style={{ fontSize: 10, color: colorA, marginBottom: 6, minHeight: 14 }}>{ready ? count : '—'}</div>

      {/* 柱子：由下往上堆疊，固定高度區域 */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: MAX_BLOCKS * BLOCK_PX, gap: 1 }}>
        {Array.from({ length: MAX_BLOCKS }).map((_, i) => {
          const filled = i >= MAX_BLOCKS - blocks;
          const isTop = i === MAX_BLOCKS - blocks;
          return (
            <div
              key={i}
              style={{
                width: 28,
                height: BLOCK_PX - 1,
                background: filled ? (i % 2 === 0 ? colorA : colorB) : emptyColor,
                boxShadow: filled && isTop ? `0 0 8px ${colorA}` : 'none',
                transition: 'background 0.3s',
              }}
            />
          );
        })}
      </div>

      {/* 底部標籤 */}
      <div style={{ height: 3, width: 28, background: colorA, marginTop: 3 }} />
      <div style={{ fontSize: 8, color: colorA, marginTop: 5, letterSpacing: 1 }}>{isRed ? 'RED' : 'WHITE'}</div>
    </div>
  );
}

export default function BattleScreen({ userId, lang, onLogout }) {
  const [level] = useState(0); // index
  const [voted, setVoted] = useState(false);
  const [choice, setChoice] = useState(null);
  const [results, setResults] = useState({ red: 0, white: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [flashClass, setFlashClass] = useState('');
  const [floatText, setFloatText] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const pollRef = useRef(null);

  const t = T[lang] || T['zh-TW'];
  const LEVELS = t.levels.map((l, i) => ({ ...l, id: i + 1 }));
  const currentLevel = LEVELS[level];
  const bossUrl = getBossAvatarUrl(BOSS_SEEDS[level % 100]);

  useEffect(() => {
    setResultsReady(false);
    fetchResults(true);
    pollRef.current = setInterval(() => fetchResults(false), 5000);
    return () => clearInterval(pollRef.current);
  }, [level]);

  async function fetchResults(isFirst = false) {
    try {
      const data = await getResults(currentLevel.id);
      setResults(data);
      if (isFirst) setResultsReady(true);
    } catch {}
  }

  async function handleVote(side) {
    if (voted || loading) return;
    setLoading(true);
    setChoice(side);
    try {
      await submitVote(userId, side, currentLevel.id);
      setVoted(true);
      // 立刻樂觀更新，不等伺服器
      setResults(prev => ({ ...prev, [side]: prev[side] + 1, total: prev.total + 1 }));
      setFlashClass(side === 'red' ? 'flash-red' : 'flash-white');
      setFloatText(side === 'red' ? '🔴 +RED' : '⚪ +WHITE');
      setTimeout(() => { setFlashClass(''); setFloatText(null); }, 1400);
      fetchResults(false); // 背景同步，不 await
      setTimeout(() => onLogout(), 4000); // 4 秒後自動跳出
    } catch {
      setChoice(null);
    }
    setLoading(false);
  }

  return (
    <div className="screen">
      <div className="stars-bg" />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 8, color: '#888' }}>{t.player}: <span style={{ color: '#ffd700' }}>{userId}</span></div>
        <div style={{ fontSize: 8, color: '#888' }}>LV.{currentLevel.id}/4</div>
        <button className="btn-pixel btn-gray" style={{ fontSize: 8, padding: '6px 10px' }} onClick={onLogout}>{t.exit}</button>
      </div>

      {/* Ticker */}
      <div className="pixel-box" style={{ overflow: 'hidden', padding: '6px 0', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <span className="marquee-text" style={{ fontSize: 8, color: '#ffd700' }}>
          {t.ticker}
        </span>
      </div>

      {/* 三欄主戰場：左紅柱 | 中央關主 | 右白柱 */}
      <div className={`pixel-box ${flashClass}`} style={{ padding: '16px 8px', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 8, color: '#888', marginBottom: 12, letterSpacing: 2, textAlign: 'center' }}>
          {currentLevel.name} — {currentLevel.subtitle}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
          {/* 左：紅柱 */}
          <SideBar count={results.red} side="red" ready={resultsReady} />

          {/* 中：關主 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              {!imgLoaded && (
                <div style={{ width: 96, height: 96, background: '#1a0a2e', border: '4px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚔️</div>
              )}
              <img
                src={bossUrl}
                alt="boss"
                className="avatar-frame"
                style={{ display: imgLoaded ? 'block' : 'none' }}
                onLoad={() => setImgLoaded(true)}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#ffd700', marginBottom: 4 }}>{currentLevel.boss}</div>
              <div style={{ fontSize: 8, color: '#666' }}>{t.total}: <span style={{ color: '#fff' }}>{resultsReady ? results.total : '—'}</span></div>
            </div>
          </div>

          {/* 右：白柱 */}
          <SideBar count={results.white} side="white" ready={resultsReady} />
        </div>

        {/* Float text */}
        {floatText && (
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 'bold', animation: 'float-up 1.2s ease forwards', pointerEvents: 'none', color: choice === 'red' ? '#e63946' : '#a8dadc' }}>
            {floatText}
          </div>
        )}
      </div>

      {/* Vote buttons */}
      {!voted && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <button
            className={`btn-pixel btn-red`}
            style={{ flex: 1 }}
            onClick={() => handleVote('red')}
            disabled={loading}
          >
            {t.redBtn}
          </button>
          <button
            className={`btn-pixel btn-white-side`}
            style={{ flex: 1 }}
            onClick={() => handleVote('white')}
            disabled={loading}
          >
            {t.whiteBtn}
          </button>
        </div>
      )}

      {/* Status */}
      <div className="pixel-box" style={{ padding: 16, marginBottom: 12, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {!voted ? (
          <div style={{ fontSize: 9, color: '#888' }} className="blink">{t.promptVote}</div>
        ) : (
          <div style={{ fontSize: 9, color: '#ffd700' }}>
            <span style={{ color: choice === 'red' ? '#e63946' : '#a8dadc' }}>{t.votedMsg(choice)}</span>
          </div>
        )}
      </div>


      {voted && level === LEVELS.length - 1 && (
        <div className="pixel-box pop-in" style={{ padding: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 14, color: '#ffd700', marginBottom: 8 }}>{t.gameClear}</div>
          <div style={{ fontSize: 9, color: '#888' }}>{t.thanks}</div>
          <div style={{ fontSize: 9, color: '#888', marginTop: 6 }}>{t.festivalEnd}</div>
        </div>
      )}
    </div>
  );
}
