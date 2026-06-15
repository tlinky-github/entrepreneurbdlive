import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const TestEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Test editor - try typing here</p>',
    autofocus: true,
    editable: true,
  });

  React.useEffect(() => {
    if (editor) {
      console.log('✓ Editor mounted');
      console.log('  - Is editable:', editor.isEditable);
      console.log('  - Has view:', !!editor.view);
      console.log('  - View DOM:', editor.view?.dom);
    }
  }, [editor]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Editor</h1>
      <p><strong>Editor Status:</strong></p>
      <ul>
        <li>Editor instance: {editor ? '✓ Exists' : '✗ Missing'}</li>
        <li>Editor editable: {editor ? (editor.isEditable ? '✓ Yes' : '✗ No') : 'N/A'}</li>
        <li>View ready: {editor?.view ? '✓ Yes' : '✗ No'}</li>
      </ul>
      
      <p><strong>Try typing in the box below:</strong></p>
      <div style={{
        border: '2px solid #667eea',
        padding: '16px',
        minHeight: '200px',
        marginTop: '10px',
        background: 'white',
      }}>
        <EditorContent editor={editor} />
      </div>
      
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Open browser console (F12) to see debug info
      </p>
    </div>
  );
};

export default TestEditor;

