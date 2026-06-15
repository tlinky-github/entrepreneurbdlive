// src/pages/VisualEditor/components/ErrorAlert.jsx
// Error display component

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorAlert({ error, onClose }) {
  return (
    <div className="error-alert">
      <div className="error-content">
        <AlertCircle size={20} className="error-icon" />
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      </div>
      <button className="error-close" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}
