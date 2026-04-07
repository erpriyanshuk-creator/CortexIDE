'use client';

import React from 'react';
import {
  Files,
  Code2,
  Bot,
  Terminal,
  Settings,
} from 'lucide-react';
import { useIDEStore } from '@/stores/use-ide-store';
import { cn } from '@/lib/utils';
import type { MobileView } from '@/lib/types';

const NAV_ITEMS: { id: MobileView; icon: React.ReactNode; label: string }[] = [
  { id: 'files', icon: <Files className="w-5 h-5" />, label: 'Files' },
  { id: 'editor', icon: <Code2 className="w-5 h-5" />, label: 'Editor' },
  { id: 'ai', icon: <Bot className="w-5 h-5" />, label: 'AI' },
  { id: 'terminal', icon: <Terminal className="w-5 h-5" />, label: 'Terminal' },
  { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'More' },
];

export function MobileNav() {
  const { mobileView, setMobileView, isMobile } = useIDEStore();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181825]/95 backdrop-blur-md border-t border-[#313244] safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = mobileView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMobileView(item.id)}
              className={cn(
                'relative flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-[#89b4fa]'
                  : 'text-[#6c7086] active:text-[#a6adc8]'
              )}
            >
              <div className={cn(
                'transition-transform duration-200',
                isActive && 'scale-110'
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#89b4fa] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
