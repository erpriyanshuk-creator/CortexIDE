'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  MessageSquare,
  ChevronUp,
} from 'lucide-react';
import { useIDEStore } from '@/stores/use-ide-store';
import { cn } from '@/lib/utils';

export function MobileAIFab() {
  const { mobileView, setMobileView } = useIDEStore();
  const [expanded, setExpanded] = useState(false);

  const handleOpen = () => {
    setMobileView('ai');
    setExpanded(false);
  };

  const handleDismiss = () => {
    setExpanded(false);
  };

  // Don't show when already on AI view
  if (mobileView === 'ai') return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded quick actions */}
      {expanded && (
        <div className="flex flex-col gap-2 animate-[nexus-slide-up_0.15s_ease-out]">
          <button
            onClick={() => { setMobileView('ai'); setExpanded(false); }}
            className="flex items-center gap-2 bg-[#181825] border border-[#313244] rounded-xl px-3 py-2 shadow-lg"
          >
            <MessageSquare className="w-4 h-4 text-[#89b4fa]" />
            <span className="text-xs text-[#cdd6f4]">New Chat</span>
          </button>
          <button
            onClick={() => { setMobileView('terminal'); setExpanded(false); }}
            className="flex items-center gap-2 bg-[#181825] border border-[#313244] rounded-xl px-3 py-2 shadow-lg"
          >
            <ChevronUp className="w-4 h-4 text-[#a6e3a1]" />
            <span className="text-xs text-[#cdd6f4]">Terminal</span>
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95',
          expanded
            ? 'bg-[#313244] shadow-lg rotate-0'
            : 'bg-gradient-to-br from-[#89b4fa] to-[#cba6f7] shadow-[#89b4fa]/30 hover:scale-105'
        )}
      >
        {expanded ? (
          <X className="w-6 h-6 text-[#cdd6f4]" />
        ) : (
          <Sparkles className="w-6 h-6 text-[#1e1e2e]" />
        )}
      </button>

      {/* Pulse ring */}
      {!expanded && (
        <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#89b4fa] to-[#cba6f7] animate-ping opacity-20" />
      )}
    </div>
  );
}
