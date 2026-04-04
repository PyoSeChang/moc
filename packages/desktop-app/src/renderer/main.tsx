import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DetachedEditorShell } from './components/editor/DetachedEditorShell';
import './styles/globals.css';

function Root(): JSX.Element {
  const hash = window.location.hash;
  const detachedMatch = hash.match(/^#\/detached\/([^/]+)$/);

  if (detachedMatch) {
    const hostId = decodeURIComponent(detachedMatch[1]);
    return <DetachedEditorShell hostId={hostId} />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
