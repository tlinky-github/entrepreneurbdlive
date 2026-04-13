import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Image as ImageIcon } from 'lucide-react';
import ImageUploader from '../common/ImageUploader';

const ImageEditorDialog = ({ open, onOpenChange, onInsert }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay bg-black/50 fixed inset-0 z-50 animate-in fade-in duration-300" />
        <Dialog.Content className="dialog-content-premium fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full p-0 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden outline-none">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ImageIcon size={18} className="text-emerald-700" />
              </div>
              <Dialog.Title className="text-lg font-bold text-stone-800">
                Media Manager
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-stone-200/50 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Uploader Body */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <ImageUploader 
              onChange={(url, meta) => {
                if (url) {
                  onInsert({ 
                    src: url, 
                    alt: meta?.alt || '', 
                    caption: meta?.caption || '',
                    title: meta?.title || ''
                  });
                  onOpenChange(false);
                }
              }} 
            />
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 italic text-[10px] text-stone-400 text-center">
            Images are securely stored on Cloudflare R2 and optimized for performance.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageEditorDialog;
