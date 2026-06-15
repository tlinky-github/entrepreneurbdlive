// src/pages/VisualEditor/ComponentEditor.jsx
// Component-based Visual Editor

import React, { useEffect, useState } from 'react';
import './ComponentEditor.css';

const ComponentEditor = ({ onBack }) => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [editingProps, setEditingProps] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    scanComponentsFromPage();
  }, []);

  const scanComponentsFromPage = () => {
    let elements = document.querySelectorAll('[data-component-file]');
    
    if (elements.length === 0) {
      const selectors = [
        'header', 'nav', 'main', 'section', 'article',
        '[class*="container"]', '[class*="card"]', '[class*="button"]',
        '[class*="component"]', '[class*="hero"]', '[class*="feature"]',
        'button', 'a[class]', 'div[id]', 'div[class*="bg-"]'
      ];
      
      const allElements = new Set();
      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            if (el.offsetHeight > 20 && el.offsetWidth > 20) {
              allElements.add(el);
            }
          });
        } catch (e) {
          // Skip
        }
      });
      
      elements = Array.from(allElements);
    }

    const found = [];
    elements.forEach((el, idx) => {
      const text = el.textContent?.substring(0, 100) || '';
      
      if (el.offsetHeight < 20 || el.offsetWidth < 20) return;
      
      found.push({
        id: idx,
        name: el.tagName.toLowerCase(),
        file: el.getAttribute('data-component-file') || el.className || 'element',
        line: el.getAttribute('data-component-line') || el.id || '?',
        text: text.trim(),
        className: el.className || '',
        elemId: el.id || '',
        element: el
      });
    });

    setComponents(found);
  };

  const handleSelectComponent = (component) => {
    if (selectedComponent?.id === component.id) {
      document.querySelectorAll('[style*="outline"]').forEach(el => {
        el.style.removeProperty('outline');
      });
      setSelectedComponent(null);
      setEditingProps({});
    } else {
      document.querySelectorAll('[style*="outline"]').forEach(el => {
        el.style.removeProperty('outline');
      });
      
      setSelectedComponent(component);
      setEditingProps({
        className: component.className || '',
        elemId: component.elemId || '',
      });
      setHasChanges(false);
      
      component.element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      component.element?.style.setProperty('outline', '3px solid #10b981', 'important');
      component.element?.style.setProperty('outline-offset', '2px', 'important');
    }
  };

  const handlePropertyChange = (key, value) => {
    setEditingProps(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (selectedComponent) {
      const el = selectedComponent.element;
      if (editingProps.className) {
        el.className = editingProps.className;
      }
      if (editingProps.elemId) {
        el.id = editingProps.elemId;
      }
      setHasChanges(false);
      alert('✅ Changes applied!');
    }
  };

  const handleRefresh = () => {
    document.querySelectorAll('[style*="outline"]').forEach(el => {
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
    });
    setSelectedComponent(null);
    setEditingProps({});
    scanComponentsFromPage();
  };

  return (
    <div className="component-editor-wrapper">
      <div className="component-editor-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">← Back</button>
          <h1 className="editor-title">🧩 Component Editor</h1>
        </div>
        <div className="header-right">
          <button onClick={handleRefresh} className="btn-refresh">🔄 Refresh</button>
        </div>
      </div>

      <div className="component-editor-main">
        <div className="preview-pane">
          <div className="preview-label">Your Page</div>
          <div className="preview-content">
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              👉 Click components to edit
            </p>
          </div>
        </div>

        <div className="component-sidebar">
          <div className="sidebar-section">
            <h3>📋 Components ({components.length})</h3>
            <div className="component-list">
              {components.length === 0 ? (
                <p className="empty">No components found</p>
              ) : (
                components.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => handleSelectComponent(comp)}
                    className={`component-item ${selectedComponent?.id === comp.id ? 'selected' : ''}`}
                  >
                    <div className="comp-name">&lt;{comp.name}&gt;</div>
                    <div className="comp-meta">{comp.file}</div>
                    <div className="comp-text">{comp.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedComponent && (
            <div className="sidebar-section properties">
              <h3>⚙️ Properties</h3>
              
              <div className="prop-group">
                <label>Class Name</label>
                <input
                  type="text"
                  value={editingProps.className || ''}
                  onChange={(e) => handlePropertyChange('className', e.target.value)}
                  className="prop-input"
                />
              </div>

              <div className="prop-group">
                <label>Element ID</label>
                <input
                  type="text"
                  value={editingProps.elemId || ''}
                  onChange={(e) => handlePropertyChange('elemId', e.target.value)}
                  className="prop-input"
                />
              </div>

              {hasChanges && <div className="unsaved">⚠️ Unsaved changes</div>}

              <button onClick={handleSaveChanges} className="btn-save">
                💾 Save
              </button>

              <div className="comp-info">
                <p><strong>File:</strong> {selectedComponent.file}</p>
                <p><strong>Tag:</strong> &lt;{selectedComponent.name}&gt;</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentEditor;
