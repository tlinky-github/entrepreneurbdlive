// src/lib/editorAPI.js
// API utilities for communicating with the visual editor dev server

const API_HOST = process.env.REACT_APP_EDITOR_HOST || 'http://localhost:3000';
const API_KEY = process.env.REACT_APP_EDITOR_KEY || '';

/**
 * Check if dev server is running
 */
export async function checkServerHealth() {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const response = await fetch(`${API_HOST}/ping`, {
      method: 'GET',
      credentials: 'omit'
    });
    return response.ok;
  } catch (error) {
    console.error('Dev server not available:', error.message);
    return false;
  }
}

/**
 * Send file edits to the dev server
 * @param {Array} changes - Array of changes to apply
 * @returns {Promise<Object>} - Response from server
 */
export async function sendFileEdits(changes) {
  if (!changes || changes.length === 0) {
    throw new Error('No changes provided');
  }

  try {
    const response = await fetch(`${API_HOST}/edit-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'x-api-key': API_KEY })
      },
      credentials: 'omit',
      body: JSON.stringify({ changes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send edits:', error);
    throw error;
  }
}

/**
 * Update a single component attribute
 * @param {string} fileName - Component file name (without extension)
 * @param {string} attributePath - Path to the attribute in AST
 * @param {string} oldValue - Old value
 * @param {string} newValue - New value
 */
export async function updateComponentAttribute(fileName, attributePath, oldValue, newValue) {
  const changes = [{
    fileName,
    changes: [{
      type: 'replace',
      path: attributePath,
      oldValue,
      newValue
    }]
  }];

  return sendFileEdits(changes);
}

/**
 * Update component className
 * @param {string} fileName - Component file name
 * @param {string} oldClasses - Old class string
 * @param {string} newClasses - New class string
 */
export async function updateComponentClass(fileName, oldClasses, newClasses) {
  return updateComponentAttribute(
    fileName,
    'JSXElement.openingElement.attributes[0].value.value',
    oldClasses,
    newClasses
  );
}

/**
 * Batch update multiple attributes
 * @param {string} fileName - Component file name
 * @param {Array<{path, oldValue, newValue}>} attributes - Attributes to update
 */
export async function batchUpdateAttributes(fileName, attributes) {
  const changes = [{
    fileName,
    changes: attributes.map(attr => ({
      type: 'replace',
      path: attr.path,
      oldValue: attr.oldValue,
      newValue: attr.newValue
    }))
  }];

  return sendFileEdits(changes);
}

/**
 * Extract component metadata from DOM elements
 * @param {Document} doc - Document to scan
 * @returns {Array<Object>} - Array of components with metadata
 */
export function extractComponentMetadata(doc) {
  if (!doc) return [];

  const elements = doc.querySelectorAll('[data-component-file]');
  const components = [];

  elements.forEach((element) => {
    const componentFile = element.getAttribute('data-component-file');
    const line = element.getAttribute('data-component-line');
    const column = element.getAttribute('data-component-column');

    // Avoid duplicates
    if (!components.find(c => c.file === componentFile && c.line === line)) {
      components.push({
        file: componentFile,
        line: parseInt(line),
        column: parseInt(column),
        element,
        displayName: `${componentFile} (L${line}:${column})`,
        tag: element.tagName.toLowerCase(),
        className: element.className,
        text: element.textContent?.substring(0, 50) || ''
      });
    }
  });

  return components;
}

/**
 * Highlight element in iframe
 * @param {Element} element - Element to highlight
 */
export function highlightElement(element) {
  if (!element) return;

  // Remove previous highlights
  document.querySelectorAll('[data-editor-highlight]').forEach(el => {
    el.removeAttribute('data-editor-highlight');
    el.style.outline = '';
  });

  // Highlight new element
  element.setAttribute('data-editor-highlight', 'true');
  element.style.outline = '2px solid #ef4337';
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Clear all highlights
 */
export function clearHighlights() {
  document.querySelectorAll('[data-editor-highlight]').forEach(el => {
    el.removeAttribute('data-editor-highlight');
    el.style.outline = '';
  });
}

/**
 * Get element attributes as object
 * @param {Element} element - DOM element
 * @returns {Object} - Attributes object
 */
export function getElementAttributes(element) {
  if (!element) return {};

  const attrs = {};
  Array.from(element.attributes).forEach(attr => {
    attrs[attr.name] = attr.value;
  });
  return attrs;
}

/**
 * Parse component file name from path
 * @param {string} filePath - Full file path
 * @returns {string} - Component name
 */
export function getComponentName(filePath) {
  return filePath.replace(/\.(jsx?|tsx?)$/, '').split('/').pop();
}
