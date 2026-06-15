// src/pages/VisualEditor/components/PropertyEditor.jsx
// Property editor for selected component

import React from 'react';
import { Save, RotateCcw } from 'lucide-react';

export default function PropertyEditor({
  component,
  editingProps,
  hasChanges,
  isLoading,
  onPropertyChange,
  onReset,
  onSave
}) {
  const handleSave = () => {
    if (!component) return;

    const changes = [{
      fileName: component.file.replace(/\.(jsx?|tsx?)$/, ''),
      changes: Object.entries(editingProps).map(([key, value]) => ({
        type: 'replace',
        attribute: key,
        value: value,
        oldValue: component.element?.getAttribute(key) || ''
      }))
    }];

    onSave(changes);
  };

  return (
    <div className="property-editor">
      <div className="properties">
        <div className="property-group">
          <label className="property-label">File</label>
          <input
            type="text"
            value={component.file}
            readOnly
            className="property-input readonly"
          />
        </div>

        <div className="property-group">
          <label className="property-label">Tag</label>
          <input
            type="text"
            value={component.tag}
            readOnly
            className="property-input readonly"
          />
        </div>

        <div className="property-divider"></div>

        <div className="property-group">
          <label className="property-label">Class Name</label>
          <textarea
            value={editingProps.class || editingProps.className || ''}
            onChange={(e) =>
              onPropertyChange('className', e.target.value)
            }
            className="property-textarea"
            placeholder="Enter classes..."
            rows={3}
          />
        </div>

        <div className="property-group">
          <label className="property-label">ID</label>
          <input
            type="text"
            value={editingProps.id || ''}
            onChange={(e) => onPropertyChange('id', e.target.value)}
            className="property-input"
            placeholder="Element ID"
          />
        </div>

        <div className="property-group">
          <label className="property-label">Data Attributes</label>
          <textarea
            value={Object.entries(editingProps)
              .filter(([key]) => key.startsWith('data-'))
              .map(([key, value]) => `${key}="${value}"`)
              .join('\n') || ''}
            readOnly
            className="property-textarea readonly"
            rows={3}
            placeholder="No data attributes"
          />
        </div>

        <div className="property-divider"></div>

        <div className="property-group">
          <label className="property-label">Style</label>
          <textarea
            value={editingProps.style || ''}
            onChange={(e) => onPropertyChange('style', e.target.value)}
            className="property-textarea"
            placeholder="Enter inline styles..."
            rows={3}
          />
        </div>

        <div className="property-group">
          <label className="property-label">All Attributes</label>
          <textarea
            value={JSON.stringify(editingProps, null, 2)}
            readOnly
            className="property-textarea readonly"
            rows={4}
          />
        </div>
      </div>

      <div className="property-actions">
        <button
          className="action-btn primary"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
        >
          <Save size={16} />
          Save Changes
        </button>
        <button
          className="action-btn secondary"
          onClick={onReset}
          disabled={!hasChanges}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {hasChanges && (
        <div className="property-notice">
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
