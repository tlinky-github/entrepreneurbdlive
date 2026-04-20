"use client";

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

export default function PublicRichEditor({ value, onChange, placeholder = 'Write your story here...' }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-900 underline font-bold tracking-tight',
          rel: 'nofollow noopener noreferrer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none min-h-[250px] p-8 text-stone-700 font-medium leading-relaxed',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return (
    <div className="w-full h-[300px] border border-stone-100 rounded-[2rem] bg-stone-50 animate-pulse flex items-center justify-center text-stone-300 font-black uppercase tracking-widest text-xs">
      Igniting Editor...
    </div>
  );

  const openLinkDialog = () => {
    const { href, target, rel } = editor.getAttributes('link');
    setActiveLinkData({ 
      href: href || '', 
      target: target || '_blank', 
      rel: rel || 'nofollow noopener noreferrer'
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
      className={`p-3 rounded-xl transition-all ${
        isActive ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 scale-105' : 'text-stone-400 hover:bg-white hover:text-stone-900'
      }`}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="w-full border border-stone-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm focus-within:ring-4 focus-within:ring-emerald-900/5 focus-within:border-emerald-900 transition-all">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-2 p-3 border-b border-stone-50 bg-stone-50/50">
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
        
        <div className="w-px h-8 bg-stone-200 mx-2" />

        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })} 
          icon={Heading2} 
          title="Major Heading" 
        />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })} 
          icon={Heading3} 
          title="Sub Heading" 
        />
        
        <div className="w-px h-8 bg-stone-200 mx-2" />
        
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
        
        <div className="w-px h-8 bg-stone-200 mx-2" />
        
        <MenuButton 
          onClick={openLinkDialog} 
          isActive={editor.isActive('link')} 
          icon={LinkIcon} 
          title="Insert Link" 
        />

        <div className="ml-auto flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => editor.chain().focus().undo().run()} 
            className="p-3 text-stone-300 hover:text-stone-600 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().redo().run()} 
            className="p-3 text-stone-300 hover:text-stone-600 transition-colors"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative">
        {editor.isEmpty && (
          <div className="absolute top-8 left-8 text-stone-300 pointer-events-none text-lg font-black uppercase tracking-widest opacity-40">
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
      <div className="px-8 py-4 border-t border-stone-50 bg-stone-50/20 flex justify-between items-center">
        <span className="text-[10px] text-stone-300 font-black uppercase tracking-widest">
           Verified Content Engine
        </span>
        <div className="flex gap-4">
           <span className="text-[10px] text-emerald-900/50 font-black uppercase tracking-widest">
              Rich-Format Optimized
           </span>
        </div>
      </div>
    </div>
  );
}
