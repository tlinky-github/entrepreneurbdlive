// src/pages/VisualEditor/components/EditorHeader.jsx
// Header component with controls

import React from 'react';
import { RotateCcw, RotateCw, RefreshCw } from 'lucide-react';

export default function EditorHeader({
  isServerReady,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRefresh
}) {
  return (
    <div className="editor-header">
      <div className="header-left">
        <h1 className="editor-title">Visual Editor</h1>
        <span className={`server-status ${isServerReady ? 'ready' : 'offline'}`}>
          <span className="status-dot"></span>
          {isServerReady ? 'Dev Server Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="header-actions">
        <button
          className="header-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={18} />
          Undo
        </button>

        <button
          className="header-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <RotateCw size={18} />
          Redo
        </button>

        <button
          className="header-btn secondary"
          onClick={onRefresh}
          title="Refresh components"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>
    </div>
  );
}
