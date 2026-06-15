import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  RotateCcw,
  RotateCw,
  Heading2,
  Heading3
} from 'lucide-react';
import LinkDialog from '../admin/LinkDialog';

const PublicRichEditor = ({ value, onChange, placeholder = 'Write your story here...' }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Use our custom Heading config
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-600 underline',
          rel: 'nofollow noopener noreferrer', // Force nofollow by default
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) return null;

  const openLinkDialog = () => {
    const { href, target, rel } = editor.getAttributes('link');
    setActiveLinkData({ 
      href: href || '', 
      target: target || '_blank', 
      rel: rel || 'nofollow noopener noreferrer' // Default to nofollow for new links
    });
    setLinkDialogOpen(true);
  };

  const handleApplyLink = ({ href, target, rel }) => {
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href, target, rel }).run();
    }
  };

  const MenuButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        isActive ? 'bg-emerald-100 text-emerald-700' : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="w-full border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-2 border-b border-stone-100 bg-stone-50/50">
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')} 
          icon={Bold} 
          title="Bold" 
        />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')} 
          icon={Italic} 
          title="Italic" 
        />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          isActive={editor.isActive('underline')} 
          icon={UnderlineIcon} 
          title="Underline" 
        />
        
        <div className="w-px h-6 bg-stone-200 mx-1" />

        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })} 
          icon={Heading2} 
          title="Heading 2" 
        />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })} 
          icon={Heading3} 
          title="Heading 3" 
        />
        
        <div className="w-px h-6 bg-stone-200 mx-1" />
        
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')} 
          icon={List} 
          title="Bullet List" 
        />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')} 
          icon={ListOrdered} 
          title="Ordered List" 
        />
        
        <div className="w-px h-6 bg-stone-200 mx-1" />
        
        <MenuButton 
          onClick={openLinkDialog} 
          isActive={editor.isActive('link')} 
          icon={LinkIcon} 
          title="Insert Link" 
        />

        <div className="ml-auto flex items-center gap-1">
          <MenuButton 
            onClick={() => editor.chain().focus().undo().run()} 
            icon={RotateCcw} 
            title="Undo" 
          />
          <MenuButton 
            onClick={() => editor.chain().focus().redo().run()} 
            icon={RotateCw} 
            title="Redo" 
          />
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative">
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-stone-400 pointer-events-none text-sm italic">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      <LinkDialog 
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialData={activeLinkData}
        onApply={handleApplyLink}
      />
      
      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-stone-50 bg-stone-50/30 flex justify-between items-center">
        <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
          Rich Text Enabled
        </span>
        <span className="text-[10px] text-stone-400">
          Basic formatting only
        </span>
      </div>
    </div>
  );
};

export default PublicRichEditor;
