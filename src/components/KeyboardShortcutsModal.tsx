'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J / ↓', description: 'Select next email' },
    { key: 'K / ↑', description: 'Select previous email' },
    { key: '/', description: 'Focus search bar' },
    { key: 'R', description: 'Refresh inbox' },
    { key: 'Esc', description: 'Close reading pane / modals' },
    { key: '?', description: 'Toggle keyboard shortcuts help' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-outlook-600 dark:text-outlook-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-none">
              <span className="text-slate-700 dark:text-slate-300">{s.description}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-outlook-600 hover:bg-outlook-700 rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
