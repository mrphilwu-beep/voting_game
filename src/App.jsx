import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import BattleScreen from './components/BattleScreen';
import './index.css';

const BASE_WIDTH = 480;

export default function App() {
  const [userId, setUserId] = useState(null);
  const [lang, setLang] = useState('zh-TW');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      setScale(Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / 700));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        width: BASE_WIDTH,
        transformOrigin: 'center center',
        transform: `scale(${scale})`,
      }}>
        {userId
          ? <BattleScreen userId={userId} lang={lang} onLogout={() => setUserId(null)} />
          : <LoginScreen onLogin={setUserId} lang={lang} onLangChange={setLang} />}
      </div>
    </div>
  );
}
