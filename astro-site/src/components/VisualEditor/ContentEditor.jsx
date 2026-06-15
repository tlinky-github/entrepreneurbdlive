// src/pages/VisualEditor/ContentEditor.jsx
// TipTap-based Rich Text Content Editor for Writers

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import './ContentEditor.css';

const ContentEditor = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: '✍️ Start writing your content here...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: '<p></p>',
    onUpdate: ({ editor }) => {
      setSaved(false);
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(words);
    },
  });

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      localStorage.setItem('tiptap-content', content);
      localStorage.setItem('tiptap-title', title);
      setSaved(true);
      alert('✅ Content saved successfully!');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      editor?.commands.clearContent();
      setTitle('');
      setSaved(false);
    }
  };

  useEffect(() => {
    const savedContent = localStorage.getItem('tiptap-content');
    const savedTitle = localStorage.getItem('tiptap-title');
    if (savedContent && editor) {
      editor.commands.setContent(savedContent);
      setSaved(true);
    }
    if (savedTitle) {
      setTitle(savedTitle);
    }
  }, [editor]);

  if (!editor) {
    return <div className="editor-loading">Loading editor...</div>;
  }

  return (
    <div className="content-editor-wrapper">
      {/* Header */}
      <div className="content-editor-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">← Back</button>
          <h1 className="editor-title">✍️ Content Editor</h1>
          <span className="badge">TipTap</span>
        </div>
        <div className="header-right">
          <span className="word-count">📊 {wordCount} words</span>
          {!saved && <span className="unsaved">⚠️ Unsaved</span>}
          {saved && <span className="saved">✅ Saved</span>}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="content-editor-main">
        {/* Left: Editor */}
        <div className="editor-container">
          {/* Toolbar */}
          <div className="editor-toolbar">
            <div className="toolbar-group">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>
              <div className="toolbar-divider"></div>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                title="Heading 3"
              >
                H3
              </button>
              <div className="toolbar-divider"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                title="Bullet List"
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                title="Ordered List"
              >
                1. List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
                title="Code Block"
              >
                {'<>'}
              </button>
              <div className="toolbar-divider"></div>
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                title="Align Left"
              >
                ⬅
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                title="Align Center"
              >
                ⬆⬇
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                title="Align Right"
              >
                ➡
              </button>
            </div>

            <div className="toolbar-group">
              <button
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
                className="toolbar-btn"
                title="Insert Image"
              >
                🖼️ Image
              </button>
              <button
                onClick={() => {
                  const url = prompt('Enter link URL:');
                  const text = prompt('Enter link text:');
                  if (url && text) {
                    editor
                      .chain()
                      .focus()
                      .insertContent(`<a href="${url}">${text}</a>`)
                      .run();
                  }
                }}
                className="toolbar-btn"
                title="Insert Link"
              >
                🔗 Link
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
                title="Blockquote"
              >
                📝 Quote
              </button>
            </div>

            <div className="toolbar-group">
              <button
                onClick={() => editor.chain().focus().undo().run()}
                className="toolbar-btn"
                title="Undo"
              >
                ↶ Undo
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                className="toolbar-btn"
                title="Redo"
              >
                ↷ Redo
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="editor-title-section">
            <input
              type="text"
              placeholder="📌 Enter article title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
              className="editor-title-input"
            />
          </div>

          {/* Editor Content */}
          <div className="editor-content-area">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="editor-preview-panel">
          <div className="preview-header">
            <h3>📖 Preview</h3>
          </div>
          <div className="preview-content">
            {title && <h1 className="preview-title">{title}</h1>}
            <div
              className="preview-body"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p></p>' }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="content-editor-footer">
        <div className="footer-left">
          <button onClick={handleClear} className="btn-secondary">
            🗑️ Clear
          </button>
        </div>
        <div className="footer-right">
          <button onClick={handleSave} className="btn-primary">
            💾 Save Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
