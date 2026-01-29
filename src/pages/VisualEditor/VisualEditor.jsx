// src/pages/VisualEditor/VisualEditor.jsx
// Editor Hub - Choose between Component Editor and Content Editor

import React, { useState } from 'react';
import ContentEditor from './ContentEditor';
import ComponentEditor from './ComponentEditor';
import './VisualEditor.css';

const VisualEditor = () => {
  const [mode, setMode] = useState(null); // null, 'content' or 'components'

  // Show Component Editor
  if (mode === 'components') {
    return <ComponentEditor onBack={() => setMode(null)} />;
  }

  // Show Content Editor
  if (mode === 'content') {
    return <ContentEditor onBack={() => setMode(null)} />;
  }

  // Show Hub Selector
  return (
    <div className="editor-hub">
      <div className="hub-container">
        <h1 className="hub-title">🎨 Choose Your Editor</h1>
        
        <div className="editor-grid">
          {/* Content Editor Card */}
          <div className="editor-card" onClick={() => setMode('content')}>
            <div className="card-icon">✍️</div>
            <h2 className="card-title">Content Editor</h2>
            <p className="card-description">
              Write and format rich content with TipTap editor
            </p>
            <ul className="card-features">
              <li>✅ Bold, italic, underline formatting</li>
              <li>✅ Headings and paragraphs</li>
              <li>✅ Lists and blockquotes</li>
              <li>✅ Images and links</li>
              <li>✅ Live preview</li>
              <li>✅ Auto-save to browser</li>
            </ul>
            <button className="card-btn">Start Writing</button>
          </div>

          {/* Component Editor Card */}
          <div className="editor-card" onClick={() => setMode('components')}>
            <div className="card-icon">🧩</div>
            <h2 className="card-title">Component Editor</h2>
            <p className="card-description">
              Edit component classes, IDs, and styles visually
            </p>
            <ul className="card-features">
              <li>✅ Auto-scan components</li>
              <li>✅ Visual selection</li>
              <li>✅ Edit classes and IDs</li>
              <li>✅ Real-time preview</li>
              <li>✅ Element highlighting</li>
              <li>✅ Save changes</li>
            </ul>
            <button className="card-btn">Edit Components</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
