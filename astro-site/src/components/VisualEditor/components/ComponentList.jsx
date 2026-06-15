// src/pages/VisualEditor/components/ComponentList.jsx
// List of available components

import React from 'react';
import { Search } from 'lucide-react';

export default function ComponentList({
  components,
  selectedComponent,
  onSelectComponent,
  isLoading
}) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredComponents = components.filter(comp =>
    comp.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (components.length === 0) {
    return (
      <div className="component-list-empty">
        <p>No components found</p>
        <p className="text-sm">Make sure the dev server is running and the page has loaded</p>
      </div>
    );
  }

  return (
    <div className="component-list">
      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="components">
        {isLoading && <div className="loading-overlay">Updating...</div>}

        {filteredComponents.length === 0 ? (
          <div className="no-results">No components match your search</div>
        ) : (
          filteredComponents.map((component, index) => (
            <div
              key={`${component.file}-${component.line}`}
              className={`component-item ${
                selectedComponent?.file === component.file &&
                selectedComponent?.line === component.line
                  ? 'selected'
                  : ''
              }`}
              onClick={() => onSelectComponent(component)}
            >
              <div className="component-name">{component.displayName}</div>
              <div className="component-tag">&lt;{component.tag}&gt;</div>
              {component.text && (
                <div className="component-text">{component.text}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="component-count">
        {filteredComponents.length} / {components.length} components
      </div>
    </div>
  );
}
