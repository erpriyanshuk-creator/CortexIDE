'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIDEStore } from '@/stores/use-ide-store';

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, updateSettings } = useIDEStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1e1e2e] border-[#313244] text-[#cdd6f4]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#cdd6f4] flex items-center gap-2">
            <span>⚙️</span> Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Editor Settings */}
          <div>
            <h3 className="text-sm font-semibold text-[#89b4fa] mb-3">Editor</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#a6adc8]">Font Size</Label>
                  <Input
                    type="number"
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) || 14 })}
                    className="bg-[#181825] border-[#313244] text-[#cdd6f4]"
                    min={10}
                    max={32}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#a6adc8]">Tab Size</Label>
                  <Select
                    value={String(settings.tabSize)}
                    onValueChange={(v) => updateSettings({ tabSize: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-[#181825] border-[#313244] text-[#cdd6f4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                      <SelectItem value="2">2 Spaces</SelectItem>
                      <SelectItem value="4">4 Spaces</SelectItem>
                      <SelectItem value="8">8 Spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#a6adc8]">Word Wrap</Label>
                <Select
                  value={settings.wordWrap}
                  onValueChange={(v) => updateSettings({ wordWrap: v as any })}
                >
                  <SelectTrigger className="bg-[#181825] border-[#313244] text-[#cdd6f4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="wordWrapColumn">Word Wrap Column</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#a6adc8]">Line Numbers</Label>
                <Select
                  value={settings.lineNumbers}
                  onValueChange={(v) => updateSettings({ lineNumbers: v as any })}
                >
                  <SelectTrigger className="bg-[#181825] border-[#313244] text-[#cdd6f4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#a6adc8]">Cursor Style</Label>
                <Select
                  value={settings.cursorStyle}
                  onValueChange={(v) => updateSettings({ cursorStyle: v as any })}
                >
                  <SelectTrigger className="bg-[#181825] border-[#313244] text-[#cdd6f4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-[#313244]" />

          {/* Appearance Settings */}
          <div>
            <h3 className="text-sm font-semibold text-[#89b4fa] mb-3">Appearance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#a6adc8]">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(v) => updateSettings({ theme: v as any })}
                >
                  <SelectTrigger className="bg-[#181825] border-[#313244] text-[#cdd6f4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                    <SelectItem value="dark">Dark (Catppuccin Mocha)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-[#a6adc8]">Minimap</Label>
                  <p className="text-[10px] text-[#6c7086]">Show minimap in editor</p>
                </div>
                <Switch
                  checked={settings.minimap}
                  onCheckedChange={(checked) => updateSettings({ minimap: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-[#a6adc8]">Bracket Colorization</Label>
                  <p className="text-[10px] text-[#6c7086]">Colorize matching brackets</p>
                </div>
                <Switch
                  checked={settings.bracketPairColorization}
                  onCheckedChange={(checked) =>
                    updateSettings({ bracketPairColorization: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-[#a6adc8]">Smooth Scrolling</Label>
                  <p className="text-[10px] text-[#6c7086]">Enable smooth scrolling</p>
                </div>
                <Switch
                  checked={settings.smoothScrolling}
                  onCheckedChange={(checked) => updateSettings({ smoothScrolling: checked })}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#313244]" />

          {/* File Settings */}
          <div>
            <h3 className="text-sm font-semibold text-[#89b4fa] mb-3">Files</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-[#a6adc8]">Auto Save</Label>
                  <p className="text-[10px] text-[#6c7086]">Automatically save files</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-[#a6adc8]">Format on Save</Label>
                  <p className="text-[10px] text-[#6c7086]">Format file on save</p>
                </div>
                <Switch
                  checked={settings.formatOnSave}
                  onCheckedChange={(checked) => updateSettings({ formatOnSave: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
