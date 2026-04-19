import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
            <div key={index} className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm relative">
              <button 
                onClick={() => removeFaq(index)}
                className="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition-colors"
                type="button"
              >
                <X size={14} />
              </button>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-emerald-600 uppercase">Question {index + 1}</label>
                  <Input 
                    defaultValue={faq.q}
                    onBlur={(e) => updateFaq(index, 'q', e.target.value)}
                    onKeyDownCapture={(e) => e.stopPropagation()}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    placeholder="Enter question..."
                    className="border-stone-100 focus:border-emerald-500 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-emerald-600 uppercase">Answer {index + 1}</label>
                  <textarea 
                    defaultValue={faq.a}
                    onBlur={(e) => updateFaq(index, 'a', e.target.value)}
                    onKeyDownCapture={(e) => e.stopPropagation()}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    placeholder="Enter answer..."
                    className="w-full min-h-[80px] p-2 text-sm border border-stone-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50/30"
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
