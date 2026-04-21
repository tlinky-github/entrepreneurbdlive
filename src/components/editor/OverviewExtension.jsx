import { Node, mergeAttributes } from '@tiptap/core';

export const OverviewBlock = Node.create({
  name: 'overviewBlock',
  group: 'block',
  content: 'block+',
  
  addAttributes() {
    return {
      class: {
        default: 'ai-overview-block',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside.ai-overview-block',
      },
      {
        tag: 'aside',
        getAttrs: (element) => element.classList.contains('ai-overview-block') && { class: 'ai-overview-block' },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { class: 'ai-overview-block' }), 0];
  },
});

export const QuickAnswer = Node.create({
  name: 'quickAnswer',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      class: {
        default: 'quick-answer',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.quick-answer',
      },
      {
        tag: 'div',
        getAttrs: (element) => element.classList.contains('quick-answer') && { class: 'quick-answer' },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'quick-answer' }), 0];
  },
});
