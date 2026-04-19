import { useState, useEffect, useRef } from 'react';
import { useModalStore } from '../store/useModalStore';

export function GlobalModals() {
  const { confirmState, promptState, selectState, resolveConfirm, resolvePrompt, resolveSelect } = useModalStore();

  // --- Prompt Modal ---
  const [promptValue, setPromptValue] = useState('');
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (promptState) {
      setPromptValue(promptState.defaultValue || '');
      setTimeout(() => promptInputRef.current?.focus(), 50);
    }
  }, [promptState]);

  if (!confirmState && !promptState && !selectState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (confirmState) resolveConfirm(false);
          if (promptState) resolvePrompt(null);
          if (selectState) resolveSelect(null);
        }}
      />

      {/* Confirm Modal */}
      {confirmState && (
        <div className="relative bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <h3 className="text-lg font-heading font-semibold mb-2">{confirmState.title}</h3>
            <p className="text-sm text-textSecondary">{confirmState.message}</p>
          </div>
          <div className="px-6 py-4 bg-surfaceHover flex items-center justify-end gap-3">
            <button 
              onClick={() => resolveConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => resolveConfirm(true)}
              className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState && (
        <div className="relative bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">{promptState.title}</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                resolvePrompt(promptValue || null);
              }}
            >
              <input
                ref={promptInputRef}
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={promptState.placeholder}
                className="w-full px-4 py-2 bg-surfaceHover border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/50 text-textPrimary placeholder:text-textSecondary/50 transition-all"
              />
            </form>
          </div>
          <div className="px-6 py-4 bg-surfaceHover flex items-center justify-end gap-3">
            <button 
              onClick={() => resolvePrompt(null)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => resolvePrompt(promptValue || null)}
              className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accentHover text-white rounded-lg transition-colors shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Select Modal */}
      {selectState && (
        <div className="relative bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">{selectState.title}</h3>
            <div className="space-y-2">
              {selectState.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => resolveSelect(opt.value)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-accent hover:bg-surfaceHover transition-colors flex items-center justify-between group"
                >
                  <span className="text-textPrimary font-medium">{opt.label}</span>
                  <span className="text-xs text-textSecondary uppercase tracking-wider bg-border px-2 py-1 rounded group-hover:bg-accent group-hover:text-white transition-colors">{opt.value}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-6 py-4 bg-surfaceHover flex items-center justify-end gap-3 border-t border-border">
            <button 
              onClick={() => resolveSelect(null)}
              className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
