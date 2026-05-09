import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, TiptapBubbleMenu } from '@tiptap/react';
import { mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import LinkDialog from '../admin/LinkDialog';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  Link as LinkIcon,
  Link2Off,
  ExternalLink,
  Edit3,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo,
  Redo,
  Minus,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';

const MenuButton = ({ onClick, isActive, disabled, children, title }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={`p-2 h-8 w-8 ${isActive ? 'bg-emerald-100 text-emerald-900' : 'text-stone-600 hover:bg-stone-100'}`}
    title={title}
  >
    {children}
  </Button>
);

const SafeLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      href: { 
        default: null,
        parseHTML: element => element.getAttribute('data-actual-href') || element.getAttribute('href'),
      },
    }
  },
  parseHTML() {
    return [
      { tag: 'a[data-actual-href]' },
      { tag: 'a[href]:not([href^="javascript:"])' },
    ]
  },
  addProseMirrorPlugins() {
    // NUCLEAR OPTION: Delete all of Tiptap's internal Link plugins.
    // This absolutely guarantees Tiptap cannot call window.open on click.
    return [];
  },
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ['a', mergeAttributes(this.options.HTMLAttributes, rest, { 'data-actual-href': href, 'class': 'cursor-pointer' }), 0];
  }
});

const TipTapEditor = ({ content, onChange, placeholder = 'Start writing your content...' }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotActionType, setCopilotActionType] = useState(null);

  const handleCopilot = async (actionStr) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText) {
       toast.error('Please highlight some text first to use AI Copilot');
       return;
    }

    try {
      setIsCopilotLoading(true);
      setCopilotActionType(actionStr);
      
      const response = await aiAPI.copilotAction({
         action: actionStr,
         text: selectedText
      });

      if (response && response.success && response.text) {
         editor.chain().focus().insertContentAt({ from, to }, response.text).run();
         toast.success('AI finished successfully!');
      } else {
         throw new Error("Invalid response format");
      }
    } catch(err) {
      toast.error('AI Copilot failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCopilotLoading(false);
      setCopilotActionType(null);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      SafeLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-900 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        let html = editor.getHTML();
        // Restore real hrefs for the saved output
        html = html.replace(/data-actual-href="/g, 'href="');
        onChange({
          json: editor.getJSON(),
          html: html,
        });
      }
    },
    editorProps: {
      handleClick: (view, pos, event) => {
        if (event.target.closest('a')) {
          event.preventDefault();
          const attrs = editor.getAttributes('link');
          if (attrs && (attrs.href || attrs['data-actual-href'])) {
            setLinkDialogOpen(true);
          }
        }
        return false; 
      }
    },
    immediatelyRender: false
  });

  useEffect(() => {
    if (editor && content) {
      const contentToSet = typeof content === 'object' ? content.html || '' : content;
      if (contentToSet && typeof contentToSet === 'string') {
        const safeContent = contentToSet.replace(/href="/g, 'data-actual-href="');
        editor.commands.setContent(safeContent);
      } else if (content && typeof content === 'object' && content.type === 'doc') {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const handleApplyLink = useCallback((data) => {
    if (data.href) {
      editor.chain().focus().extendMarkRange('link').setLink({ 
        href: data.href,
        target: data.target,
        rel: data.rel
      }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkDialogOpen(false);
  }, [editor]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageUrl('');
    setImageDialogOpen(false);
  }, [editor, imageUrl]);

  const addYoutubeVideo = useCallback(() => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    }
    setYoutubeUrl('');
    setYoutubeDialogOpen(false);
  }, [editor, youtubeUrl]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-stone-100 h-96 rounded-lg" />;
  }

  return (
    <div 
      className="tiptap-editor border border-stone-200 rounded-lg overflow-hidden bg-white" 
      data-testid="tiptap-editor"
    >
      {/* Toolbar */}
      <div className="border-b border-stone-200 bg-stone-50 p-2 flex flex-wrap gap-1">
        {/* History */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Text formatting */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Headings */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Lists */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Block elements */}
        <div className="flex items-center border-r border-stone-200 pr-2 mr-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Insert elements */}
        <div className="flex items-center">
          <MenuButton 
            onClick={() => {
              setLinkDialogOpen(true);
            }} 
            isActive={editor.isActive('link')} 
            title="Add/Edit Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => setImageDialogOpen(true)} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={() => setYoutubeDialogOpen(true)} title="Add YouTube Video">
            <YoutubeIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton onClick={addTable} title="Add Table">
            <TableIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* AI Copilot Toolbar */}
        <div className="flex items-center ml-auto">
          <div className="flex items-center bg-indigo-50 rounded pl-2 pr-1 py-0.5 border border-indigo-100 shadow-sm">
            <span className="text-xs font-bold text-indigo-800 mr-2 flex items-center uppercase tracking-wider">AI Copilot</span>
            {isCopilotLoading ? (
              <span className="text-xs font-semibold text-indigo-600 px-2 py-1 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <MenuButton onClick={() => handleCopilot('rewrite')} title="Rewrite Selected Text" className="hover:bg-indigo-100">
                  <Wand2 className="w-4 h-4 text-indigo-700" />
                </MenuButton>
                <MenuButton onClick={() => handleCopilot('expand')} title="Expand Selected Text" className="hover:bg-indigo-100">
                  <Sparkles className="w-4 h-4 text-indigo-700" />
                </MenuButton>
                <button type="button" onClick={() => handleCopilot('summarize')} className="text-xs font-semibold text-indigo-700 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors" title="Summarize">
                  Sum
                </button>
                <button type="button" onClick={() => handleCopilot('grammar')} className="text-xs font-semibold text-indigo-700 hover:bg-indigo-100 px-2 py-1.5 rounded transition-colors" title="Fix Grammar">
                  A+
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Bubble Menu (WordPress style) */}
      {editor && (
        <TiptapBubbleMenu 
          editor={editor} 
          pluginKey="main-editor-link-menu"
          shouldShow={({ editor }) => editor.isActive('link')}
          tippyOptions={{ duration: 100 }}
        >
          <div className="bg-white border border-stone-200 rounded-lg shadow-xl p-1 flex items-center gap-1">
            <span className="text-stone-500 text-[10px] uppercase font-bold px-2 border-r border-stone-100">Link</span>
            <a 
              href={editor.getAttributes('link').href || editor.getAttributes('link')['data-actual-href']} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline px-2 text-xs font-medium max-w-[150px] truncate"
              title={editor.getAttributes('link').href || editor.getAttributes('link')['data-actual-href']}
            >
              {editor.getAttributes('link').href || editor.getAttributes('link')['data-actual-href']}
            </a>
            
            <div className="h-4 w-px bg-stone-100 mx-1" />
            
            <MenuButton 
              onClick={() => window.open(editor.getAttributes('link').href || editor.getAttributes('link')['data-actual-href'], '_blank')} 
              title="Open in new tab"
            >
              <ExternalLink size={14} className="text-emerald-600" />
            </MenuButton>

            <MenuButton 
              onClick={() => {
                setLinkDialogOpen(true);
              }} 
              title="Edit Link"
            >
              <Edit3 size={14} className="text-emerald-600" />
            </MenuButton>

            <MenuButton 
              onClick={() => editor.chain().focus().unsetLink().run()} 
              title="Remove Link"
            >
              <Link2Off size={14} className="text-red-500" />
            </MenuButton>
          </div>
        </TiptapBubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-96" />

      {/* Link Dialog */}
      <LinkDialog 
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialData={editor.getAttributes('link')}
        onUnlink={() => {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
        }}
        onApply={handleApplyLink}
      />

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            data-testid="image-url-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={addImage} className="bg-emerald-900 hover:bg-emerald-800">Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Video</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            data-testid="youtube-url-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)}>Cancel</Button>
            <Button onClick={addYoutubeVideo} className="bg-emerald-900 hover:bg-emerald-800">Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipTapEditor;
