import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { HostDashboard } from './pages/HostDashboard';
import { HostControlPanel } from './pages/HostControlPanel';
import { ProjectorScreen } from './pages/ProjectorScreen';
import { PlayerApp } from './pages/PlayerApp';

export function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('qb_lang') || 'en');

  const handleSetLang = (next) => {
    setLang(next);
    localStorage.setItem('qb_lang', next);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage lang={lang} setLang={handleSetLang} />} />
        <Route path="/host" element={<HostDashboard lang={lang} setLang={handleSetLang} />} />
        <Route path="/host/live/:pin" element={<HostControlPanel />} />
        <Route path="/projector/:pin" element={<ProjectorScreen />} />
        <Route path="/play" element={<PlayerApp lang={lang} setLang={handleSetLang} />} />
        <Route path="/play/:pin" element={<PlayerApp lang={lang} setLang={handleSetLang} />} />
        <Route path="/join/:pin" element={<PlayerApp lang={lang} setLang={handleSetLang} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
