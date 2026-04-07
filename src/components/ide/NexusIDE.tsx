'use client';

import React, { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useIDEStore } from '@/stores/use-ide-store';
import { IDELayout } from '@/components/ide/IDELayout';
import { MobileNav } from '@/components/ide/MobileNav';
import { CommandPalette } from '@/components/ide/CommandPalette';
import { SettingsDialog } from '@/components/ide/SettingsDialog';
import { ShortcutsOverlay, useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import { NotificationToasts } from '@/components/ide/NotificationCenter';
import { Toaster } from '@/components/ui/sonner';
import { pushNotification } from '@/components/ide/NotificationCenter';

const emptySubscribe = () => () => {};

export default function NexusIDE() {
  const { theme } = useTheme();
  const { isMobile, setIsMobile, commandPaletteOpen, setCommandPaletteOpen, settingsDialogOpen, setSettingsDialogOpen } = useIDEStore();
  const { shortcutsOpen, setShortcutsOpen } = useKeyboardShortcuts();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Welcome notification on first load
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        pushNotification('info', 'Welcome to NexusIDE', 'Press Ctrl+/ for keyboard shortcuts or Ctrl+K for the command palette.');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#1e1e2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#89b4fa] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#cdd6f4] text-sm font-mono">Loading NexusIDE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden ${theme === 'dark' || !theme ? 'dark' : ''}`} data-theme={theme}>
      <div className="dark h-full w-full">
        <IDELayout />
        {!isMobile && (
          <>
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
            <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
          </>
        )}
        <MobileNav />
        <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <NotificationToasts />
        <Toaster />
      </div>
    </div>
  );
}
