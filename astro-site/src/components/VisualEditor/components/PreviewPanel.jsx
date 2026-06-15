// src/pages/VisualEditor/components/PreviewPanel.jsx
// Preview panel showing the live app

import React, { useEffect } from 'react';

export default function PreviewPanel({
  iframeRef,
  onIframeLoad,
  selectedComponent
}) {
  useEffect(() => {
    if (iframeRef.current) {
      const API_HOST = process.env.REACT_APP_EDITOR_HOST || (typeof window !== 'undefined' ? window.location.origin : '');
      const iframe = iframeRef.current;
      iframe.addEventListener('load', onIframeLoad);
      return () => iframe.removeEventListener('load', onIframeLoad);
    }
  }, [iframeRef, onIframeLoad]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h2>Live Preview</h2>
        {selectedComponent && (
          <p className="preview-selected">
            Selected: <strong>{selectedComponent.displayName}</strong>
          </p>
        )}
      </div>
      <iframe
        ref={iframeRef}
        src={typeof window !== 'undefined' ? window.location.origin : '/'}
        title="Live Preview"
        className="preview-iframe"
      />
    </div>
  );
}
