import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, X, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon, Bold, Italic } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import LinkDialog from '../admin/LinkDialog';

const FaqAnswerEditor = ({ value, onChange }) => {
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }), 
      Link.configure({ 
        openOnClick: false, 
        HTMLAttributes: { 
          class: 'text-emerald-600 underline hover:text-emerald-700 transition-colors',
          target: '_blank',
          rel: 'nofollow noopener noreferrer'
        }
      })
    ],
    content: value,
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'w-full min-h-[40px] px-3 py-2 text-sm focus:outline-none bg-stone-50/10 faq-answer-editor'
      }
    }
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleSetLink = (url) => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ 
        href: url,
        target: '_blank',
        rel: 'nofollow noopener noreferrer'
      }).run();
    }
    setLinkDialogOpen(false);
  };

  return (
    <div className="flex flex-col border border-stone-200 rounded-md bg-white overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
      <div className="flex px-2 py-1 bg-stone-50 border-b border-stone-200 gap-1 items-center">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={`p-1.5 text-stone-500 rounded hover:bg-stone-200 ${editor.isActive('bold') ? 'bg-stone-200 text-stone-900' : ''}`}><Bold size={14}/></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={`p-1.5 text-stone-500 rounded hover:bg-stone-200 ${editor.isActive('italic') ? 'bg-stone-200 text-stone-900' : ''}`}><Italic size={14}/></button>
        <div className="w-px h-4 bg-stone-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); setLinkDialogOpen(true); }} className={`p-1.5 text-stone-500 rounded hover:bg-stone-200 flex items-center gap-1 ${editor.isActive('link') ? 'bg-emerald-100 text-emerald-700' : ''}`}><LinkIcon size={14}/><span className="text-[10px] font-medium leading-none">Link</span></button>
      </div>
      <EditorContent editor={editor} onKeyDownCapture={e => e.stopPropagation()} onMouseDownCapture={e => e.stopPropagation()} />
      
      <LinkDialog 
        open={linkDialogOpen} 
        onOpenChange={setLinkDialogOpen}
        onSetLink={handleSetLink}
        defaultUrl={editor.getAttributes('link').href || ''}
      />
    </div>
  );
};

const FaqComponent = ({ node, updateAttributes, deleteNode, editor }) => {
  const faqs = node.attrs.faqs || [];

  const addFaq = () => {
    updateAttributes({
      faqs: [...faqs, { q: '', a: '' }],
    });
  };

  const removeFaq = (index) => {
    const newFaqs = [...faqs];
    newFaqs.splice(index, 1);
    updateAttributes({ faqs: newFaqs });
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    updateAttributes({ faqs: newFaqs });
  };

  const moveFaqUp = (index) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[index - 1];
    newFaqs[index - 1] = temp;
    updateAttributes({ faqs: newFaqs });
  };

  const moveFaqDown = (index) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[index + 1];
    newFaqs[index + 1] = temp;
    updateAttributes({ faqs: newFaqs });
  };

  const convertToText = () => {
    if (!editor) return;
    
    let html = '';
    faqs.forEach(f => {
      if (f.q || f.a) {
        html += `<h4>${f.q}</h4><p>${f.a}</p>`;
      }
    });

    if (!html) {
      deleteNode();
      return;
    }

    // Get the current position of the node
    const pos = editor.state.selection.$from.before();
    
    // We must execute this in a single transaction
    editor.chain()
      .focus()
      .insertContentAt(pos, html)
      .run();
      
    // Remove the original FAQ node
    deleteNode();
  };

  return (
    <NodeViewWrapper className="faq-section-node my-8">
      <div contentEditable={false} className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-2xl p-6 relative group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white">
              <HelpCircle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 leading-tight">Inline FAQ Block</h4>
              <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">SEO Optimized Questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={convertToText}
              className="text-xs h-7 text-stone-500 hover:text-emerald-700 bg-white"
              title="Convert this block back into normal text headings and paragraphs"
            >
              Convert to Text
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={deleteNode}
              className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm relative pr-10">
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-center border border-stone-100 bg-stone-50 rounded p-1">
                <button type="button" onClick={() => moveFaqUp(index)} disabled={index === 0} className={`p-1 rounded ${index === 0 ? 'text-stone-200' : 'text-stone-500 hover:bg-stone-200'}`}>
                  <ChevronUp size={14} />
                </button>
                <div className="w-full h-px bg-stone-200" />
                <button type="button" onClick={() => removeFaq(index)} className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X size={14} />
                </button>
                <div className="w-full h-px bg-stone-200" />
                <button type="button" onClick={() => moveFaqDown(index)} disabled={index === faqs.length - 1} className={`p-1 rounded ${index === faqs.length - 1 ? 'text-stone-200' : 'text-stone-500 hover:bg-stone-200'}`}>
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-emerald-600 uppercase">Question {index + 1}</label>
                  <Input 
                    value={faq.q}
                    onChange={(e) => updateFaq(index, 'q', e.target.value)}
                    onKeyDownCapture={(e) => e.stopPropagation()}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    placeholder="Enter question..."
                    className="border-stone-100 focus:border-emerald-500 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-emerald-600 uppercase">Answer {index + 1}</label>
                  <FaqAnswerEditor 
                    value={faq.a} 
                    onChange={(val) => updateFaq(index, 'a', val)} 
                  />
                </div>
              </div>
            </div>
          ))}

          <Button 
            onClick={addFaq}
            variant="outline"
            className="w-full border-dashed border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 h-12"
          >
            <Plus size={16} className="mr-2" />
            Add Question & Answer
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default Node.create({
  name: 'faqSection',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      faqs: {
        default: [],
        parseHTML: element => {
            const data = element.getAttribute('data-faqs');
            return data ? JSON.parse(data) : [];
        },
        renderHTML: attributes => ({
            'data-faqs': JSON.stringify(attributes.faqs),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'faq-section',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['faq-section', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqComponent);
  },
});
