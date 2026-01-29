// src/hooks/useVisualEditor.js
// Custom hook for managing visual editor state

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  checkServerHealth,
  sendFileEdits,
  extractComponentMetadata,
  highlightElement,
  clearHighlights
} from '../lib/editorAPI';

/**
 * Hook for managing visual editor state and operations
 */
export function useVisualEditor() {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [iframeDoc, setIframeDoc] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef(null);

  // Initialize server connection
  const initializeServer = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('Dev server not running. Make sure to run: npm start');
      }

      setIsServerReady(true);
    } catch (err) {
      setError(err.message);
      setIsServerReady(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scan iframe for components
  const scanComponents = useCallback((doc) => {
    if (!doc) return;

    setIframeDoc(doc);
    const foundComponents = extractComponentMetadata(doc);
    setComponents(foundComponents);
  }, []);

  // Handle iframe load
  const handleIframeLoad = useCallback((iframe) => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        scanComponents(doc);
      }
    } catch (err) {
      console.error('Cannot access iframe content:', err);
    }
  }, [scanComponents]);

  // Select component
  const selectComponent = useCallback((component) => {
    setSelectedComponent(component);
    if (component && component.element) {
      highlightElement(component.element);
    }
  }, []);

  // Deselect component
  const deselectComponent = useCallback(() => {
    setSelectedComponent(null);
    clearHighlights();
  }, []);

  // Save changes to file
  const saveChanges = useCallback(async (changes) => {
    if (!changes || changes.length === 0) {
      setError('No changes to save');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendFileEdits(changes);

      if (result.success) {
        // Add to history
        setEditHistory([
          ...editHistory.slice(0, historyIndex + 1),
          changes
        ]);
        setHistoryIndex(historyIndex + 1);

        return result;
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [editHistory, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, editHistory.length]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setIsServerReadyManually = useCallback((ready) => {
    setIsServerReady(ready);
  }, []);

  return {
    // State
    isServerReady,
    isLoading,
    error,
    components,
    selectedComponent,
    iframeRef,
    iframeDoc,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < editHistory.length - 1,

    // Methods
    initializeServer,
    scanComponents,
    handleIframeLoad,
    selectComponent,
    deselectComponent,
    saveChanges,
    undo,
    redo,
    clearError,
    setIsServerReady: setIsServerReadyManually
  };
}

/**
 * Hook for managing property editing
 */
export function usePropertyEditor(selectedComponent) {
  const [editingProps, setEditingProps] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Update when component changes
  useEffect(() => {
    if (selectedComponent && selectedComponent.element) {
      const attrs = {};
      Array.from(selectedComponent.element.attributes).forEach(attr => {
        attrs[attr.name] = attr.value;
      });
      setEditingProps(attrs);
      setHasChanges(false);
    }
  }, [selectedComponent]);

  // Update property
  const updateProperty = useCallback((key, value) => {
    setEditingProps(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  }, []);

  // Reset changes
  const resetChanges = useCallback(() => {
    if (selectedComponent && selectedComponent.element) {
      const attrs = {};
      Array.from(selectedComponent.element.attributes).forEach(attr => {
        attrs[attr.name] = attr.value;
      });
      setEditingProps(attrs);
      setHasChanges(false);
    }
  }, [selectedComponent]);

  return {
    editingProps,
    hasChanges,
    updateProperty,
    resetChanges,
    setEditingProps
  };
}
