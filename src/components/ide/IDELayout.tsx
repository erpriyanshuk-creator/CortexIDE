'use client';

import React from 'react';
import { useIDEStore } from '@/stores/use-ide-store';
import { Sidebar } from '@/components/ide/Sidebar';
import { EditorTabs } from '@/components/ide/EditorTabs';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { AIPanel } from '@/components/ide/AIPanel';
import { BottomPanel } from '@/components/ide/BottomPanel';
import { StatusBar } from '@/components/ide/StatusBar';
import { WelcomeTab } from '@/components/ide/WelcomeTab';
import { MobileCodeEditor } from '@/components/ide/MobileCodeEditor';
import { MobileTerminal } from '@/components/ide/MobileTerminal';
import { MobileAIFab } from '@/components/ide/MobileAIFab';
import { useEditorStore } from '@/stores/use-editor-store';

export function IDELayout() {
  const {
    sidebarOpen,
    rightPanelOpen,
    bottomPanelOpen,
    isMobile,
    panelSizes,
  } = useIDEStore();

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          <MobileLayout />
        ) : (
          <DesktopLayout />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

function DesktopLayout() {
  const {
    sidebarOpen,
    rightPanelOpen,
    bottomPanelOpen,
    panelSizes,
  } = useIDEStore();
  const activeTabId = useEditorStore((s) => s.activeTabId);

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      {sidebarOpen && (
        <div
          className="h-full border-r border-[#313244] flex-shrink-0 overflow-hidden animate-[nexus-slide-left_0.15s_ease-out]"
          style={{ width: panelSizes.sidebarWidth }}
        >
          <Sidebar />
        </div>
      )}

      {/* Center + Right Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex min-h-0">
          {/* Center: Editor area */}
          <div className="flex-1 flex flex-col min-w-0">
            <EditorTabs />
            <div className="flex-1 min-h-0 relative">
              {activeTabId ? (
                <div className="h-full w-full animate-[nexus-fade-in_0.1s_ease-out]">
                  <CodeEditor />
                </div>
              ) : (
                <WelcomeTab />
              )}
            </div>
          </div>

          {/* Right Panel: AI Chat */}
          {rightPanelOpen && (
            <div
              className="h-full border-l border-[#313244] flex-shrink-0 overflow-hidden animate-[nexus-slide-right_0.15s_ease-out]"
              style={{ width: panelSizes.rightPanelWidth }}
            >
              <AIPanel />
            </div>
          )}
        </div>

        {/* Bottom Panel */}
        {bottomPanelOpen && (
          <div
            className="border-t border-[#313244] flex-shrink-0 overflow-hidden animate-[nexus-slide-up_0.15s_ease-out]"
            style={{ height: panelSizes.bottomPanelHeight }}
          >
            <BottomPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function MobileLayout() {
  const { mobileView } = useIDEStore();
  const activeTabId = useEditorStore((s) => s.activeTabId);

  return (
    <div className="h-full pb-14">
      {mobileView === 'files' && (
        <div className="h-full animate-[nexus-fade-in_0.15s_ease-out]">
          <Sidebar />
        </div>
      )}
      {(mobileView === 'editor' || mobileView === 'ai' || mobileView === 'terminal') && (
        <div className="h-full flex flex-col animate-[nexus-fade-in_0.1s_ease-out]">
          <EditorTabs />
          <div className="flex-1 min-h-0">
            {activeTabId ? <MobileCodeEditor /> : <WelcomeTab />}
          </div>
          {mobileView === 'ai' && (
            <div className="h-1/2 border-t border-[#313244] overflow-hidden animate-[nexus-slide-up_0.15s_ease-out]">
              <AIPanel />
            </div>
          )}
          {mobileView === 'terminal' && (
            <div className="h-1/2 border-t border-[#313244] overflow-hidden animate-[nexus-slide-up_0.15s_ease-out]">
              <MobileTerminal />
            </div>
          )}
        </div>
      )}

      {/* Mobile AI FAB */}
      <MobileAIFab />
    </div>
  );
}
