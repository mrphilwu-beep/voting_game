import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ResultsDisplay from './components/ResultsDisplay';
import './index.css';

function ResultsApp() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    function onResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ResultsDisplay width={size.w} height={size.h} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ResultsApp />
  </StrictMode>
);
