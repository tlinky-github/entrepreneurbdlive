import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { X, ExternalLink, Shield, DollarSign, Check } from 'lucide-react';

const LinkDialog = ({ open, onOpenChange, initialData, onApply }) => {
  const [url, setUrl] = useState('');
  const [targetBlank, setTargetBlank] = useState(false);
  const [noFollow, setNoFollow] = useState(false);
  const [sponsored, setSponsored] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(initialData?.href || '');
      setTargetBlank(initialData?.target === '_blank');
      const rel = initialData?.rel || '';
      setNoFollow(rel.includes('nofollow'));
      setSponsored(rel.includes('sponsored'));
    }
  }, [open, initialData]);

  const handleApply = () => {
    let rels = ['noopener', 'noreferrer'];
    if (noFollow) rels.push('nofollow');
    if (sponsored) rels.push('sponsored');

    onApply({
      href: url,
      target: targetBlank ? '_blank' : null,
      rel: rels.join(' ')
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay bg-black/60 fixed inset-0 z-[100] backdrop-blur-sm animate-in fade-in duration-300" />
        <Dialog.Content className="dialog-content-premium fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full p-6 bg-white rounded-2xl shadow-2xl z-[101] outline-none animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-slate-800">
              Link Settings
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Enter the URL and configure link attributes like target and follow.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 outline-none">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox.Root
                  className="checkbox-root"
                  checked={targetBlank}
                  onCheckedChange={setTargetBlank}
                  id="targetBlank"
                >
                  <Checkbox.Indicator className="checkbox-indicator">
                    <Check size={14} className="text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label className="flex items-center space-x-2 cursor-pointer select-none" htmlFor="targetBlank">
                  <ExternalLink size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Open in new tab</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox.Root
                  className="checkbox-root"
                  checked={noFollow}
                  onCheckedChange={setNoFollow}
                  id="noFollow"
                >
                  <Checkbox.Indicator className="checkbox-indicator">
                    <Check size={14} className="text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label className="flex items-center space-x-2 cursor-pointer select-none" htmlFor="noFollow">
                  <Shield size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Set to "nofollow"</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox.Root
                  className="checkbox-root"
                  checked={sponsored}
                  onCheckedChange={setSponsored}
                  id="sponsored"
                >
                  <Checkbox.Indicator className="checkbox-indicator">
                    <Check size={14} className="text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label className="flex items-center space-x-2 cursor-pointer select-none" htmlFor="sponsored">
                  <DollarSign size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Set to "sponsored"</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-emerald-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-800 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Apply Link
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LinkDialog;
