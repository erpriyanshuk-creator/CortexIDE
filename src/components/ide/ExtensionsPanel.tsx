'use client';

import React, { useState, useMemo } from 'react';
import {
  Blocks,
  Search,
  Star,
  Download,
  Check,
  X,
  ChevronRight,
  Palette,
  Code2,
  Brain,
  Wrench,
  Zap,
  Filter,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExtensionCategory = 'all' | 'themes' | 'languages' | 'ai-models' | 'tools' | 'productivity';
type ExtensionState = 'installed' | 'available';

interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: Exclude<ExtensionCategory, 'all'>;
  rating: number;
  downloads: string;
  icon: string;
  state: ExtensionState;
  enabled: boolean;
  featured?: boolean;
}

const EXTENSIONS: Extension[] = [
  {
    id: 'nexus-ai-pro', name: 'NexusAI Pro', description: 'Advanced AI code completion with multi-model support and context-aware suggestions.', author: 'NexusIDE', version: '2.4.1', category: 'ai-models', rating: 4.9, downloads: '2.1M', icon: '🤖', state: 'installed', enabled: true, featured: true,
  },
  {
    id: 'catppuccin-mocha', name: 'Catppuccin Mocha', description: 'Soothing pastel theme for the high-spirited! The dark theme you already love.', author: 'Catppuccin', version: '1.2.0', category: 'themes', rating: 4.9, downloads: '5.8M', icon: '🎨', state: 'installed', enabled: true, featured: true,
  },
  {
    id: 'gitlens-plus', name: 'GitLens+', description: 'Supercharge Git with inline blame, history navigation, and repository insights.', author: 'NexusIDE', version: '3.1.0', category: 'tools', rating: 4.7, downloads: '4.2M', icon: '🔍', state: 'installed', enabled: true,
  },
  {
    id: 'prettier', name: 'Prettier', description: 'Opinionated code formatter. Supports many languages and integrates with ESLint.', author: 'Prettier', version: '3.2.0', category: 'tools', rating: 4.6, downloads: '38M', icon: '✨', state: 'installed', enabled: true,
  },
  {
    id: 'eslint', name: 'ESLint', description: 'Find and fix problems in your JavaScript/TypeScript code. Pluggable linting.', author: 'Microsoft', version: '8.56.0', category: 'tools', rating: 4.7, downloads: '42M', icon: '🔍', state: 'installed', enabled: true,
  },
  {
    id: 'one-dark-pro', name: 'One Dark Pro', description: 'Atom One Dark theme faithfully recreated with refined syntax highlighting.', author: 'Binaryify', version: '1.8.0', category: 'themes', rating: 4.8, downloads: '18M', icon: '🌙', state: 'available', enabled: false,
  },
  {
    id: 'docker', name: 'Docker', description: 'Build, manage, and deploy containerized applications from the IDE.', author: 'Microsoft', version: '2.1.0', category: 'tools', rating: 4.5, downloads: '29M', icon: '🐳', state: 'available', enabled: false,
  },
  {
    id: 'tailwindcss', name: 'Tailwind CSS IntelliSense', description: 'Intelligent Tailwind CSS tooling with class name autocomplete and linting.', author: 'Tailwind Labs', version: '0.10.0', category: 'languages', rating: 4.7, downloads: '12M', icon: '💨', state: 'available', enabled: false,
  },
  {
    id: 'copilot-lite', name: 'Copilot Lite', description: 'Lightweight AI pair programmer with fast inline suggestions and chat.', author: 'GitHub', version: '1.5.0', category: 'ai-models', rating: 4.6, downloads: '15M', icon: '⚡', state: 'available', enabled: false, featured: true,
  },
  {
    id: 'todo-tree', name: 'Todo Tree', description: 'Quickly search and navigate all TODO, FIXME, and HACK comments in your project.', author: 'Gruntfuggly', version: '0.0.219', category: 'productivity', rating: 4.6, downloads: '8.1M', icon: '📋', state: 'available', enabled: false,
  },
  {
    id: 'rust-analyzer', name: 'rust-analyzer', description: 'Modular compiler frontend for Rust with IDE features, completion, and go-to-definition.', author: 'Rust Lang', version: '0.4.0', category: 'languages', rating: 4.8, downloads: '6.3M', icon: '🦀', state: 'available', enabled: false,
  },
  {
    id: 'zen-mode', name: 'Zen Mode', description: 'Distraction-free coding with fullscreen, centered layout, and no UI chrome.', author: 'NexusIDE', version: '1.0.0', category: 'productivity', rating: 4.4, downloads: '2.3M', icon: '🧘', state: 'available', enabled: false,
  },
  {
    id: 'error-lens', name: 'Error Lens', description: 'Highlight errors and warnings inline with the code, making them instantly visible.', author: 'usernamehw', version: '3.8.0', category: 'productivity', rating: 4.7, downloads: '4.5M', icon: '👁️', state: 'available', enabled: false,
  },
  {
    id: 'go-night', name: 'Go Night Theme', description: 'A refined dark theme optimized for Go development with syntax-aware colors.', author: 'Go Team', version: '1.1.0', category: 'themes', rating: 4.3, downloads: '1.2M', icon: '🐹', state: 'available', enabled: false,
  },
  {
    id: 'gpt-engineer', name: 'GPT Engineer Agent', description: 'AI agent that can scaffold entire projects from natural language descriptions.', author: 'NexusAI', version: '0.9.0', category: 'ai-models', rating: 4.5, downloads: '890K', icon: '🏗️', state: 'available', enabled: false,
  },
];

const CATEGORIES: { id: ExtensionCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Blocks className="w-3 h-3" /> },
  { id: 'themes', label: 'Themes', icon: <Palette className="w-3 h-3" /> },
  { id: 'languages', label: 'Languages', icon: <Code2 className="w-3 h-3" /> },
  { id: 'ai-models', label: 'AI Models', icon: <Brain className="w-3 h-3" /> },
  { id: 'tools', label: 'Tools', icon: <Wrench className="w-3 h-3" /> },
  { id: 'productivity', label: 'Productivity', icon: <Zap className="w-3 h-3" /> },
];

export function ExtensionsPanel() {
  const [extensions, setExtensions] = useState(EXTENSIONS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExtensionCategory>('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'installed'>('browse');

  const installedExts = useMemo(() => extensions.filter(e => e.state === 'installed'), [extensions]);
  const availableExts = useMemo(() => extensions.filter(e => e.state === 'available'), [extensions]);

  const displayedExts = useMemo(() => {
    const base = activeTab === 'installed' ? installedExts : availableExts;
    return base.filter(ext => {
      const matchCat = category === 'all' || ext.category === category;
      const matchSearch = !search.trim() ||
        ext.name.toLowerCase().includes(search.toLowerCase()) ||
        ext.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeTab, installedExts, availableExts, category, search]);

  const toggleEnabled = (id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };

  const installExtension = (id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, state: 'installed' as const, enabled: true } : e));
  };

  const uninstallExtension = (id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, state: 'available' as const, enabled: false } : e));
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const partial = rating - full;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-2.5 h-2.5',
              i < full ? 'text-[#f9e2af] fill-[#f9e2af]' : i < full + 1 && partial > 0 ? 'text-[#f9e2af] fill-[#f9e2af]/50' : 'text-[#45475a]'
            )}
          />
        ))}
        <span className="text-[9px] text-[#6c7086] ml-0.5">{rating}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6c7086]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extensions..."
            className="w-full bg-[#1e1e2e] border border-[#313244] rounded-md px-7 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pb-1">
        <button
          onClick={() => setActiveTab('browse')}
          className={cn(
            'flex-1 py-1 text-[10px] rounded transition-colors text-center',
            activeTab === 'browse' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
          )}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={cn(
            'flex-1 py-1 text-[10px] rounded transition-colors text-center relative',
            activeTab === 'installed' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
          )}
        >
          Installed
          {installedExts.length > 0 && (
            <span className="absolute -top-0.5 -right-1 bg-[#89b4fa] text-[#1e1e2e] w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-bold">
              {installedExts.length}
            </span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-0.5 px-3 pb-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-all flex-shrink-0',
              category === cat.id
                ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#1e1e2e]'
            )}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Extensions list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'browse' && displayedExts.filter(e => e.featured).length > 0 && !search && category === 'all' && (
          <div className="px-3 pt-1 pb-2">
            <div className="flex items-center gap-1 text-[10px] text-[#6c7086] uppercase tracking-wider">
              <TrendingUp className="w-2.5 h-2.5" />
              Featured
            </div>
            {displayedExts.filter(e => e.featured).map(ext => (
              <ExtensionCard
                key={ext.id}
                extension={ext}
                onToggle={toggleEnabled}
                onInstall={installExtension}
                onUninstall={uninstallExtension}
                renderStars={renderStars}
                featured
              />
            ))}
          </div>
        )}

        <div className="px-3 pb-2">
          {displayedExts.filter(e => activeTab === 'installed' || !e.featured || search || category !== 'all').map(ext => (
            <ExtensionCard
              key={ext.id}
              extension={ext}
              onToggle={toggleEnabled}
              onInstall={installExtension}
              onUninstall={uninstallExtension}
              renderStars={renderStars}
            />
          ))}
        </div>

        {displayedExts.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Blocks className="w-8 h-8 text-[#45475a] mx-auto mb-2" />
            <p className="text-xs text-[#6c7086]">
              {activeTab === 'installed' ? 'No extensions installed' : 'No extensions found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExtensionCard({
  extension,
  onToggle,
  onInstall,
  onUninstall,
  renderStars,
  featured,
}: {
  extension: Extension;
  onToggle: (id: string) => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  renderStars: (r: number) => React.ReactNode;
  featured?: boolean;
}) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = () => {
    setInstalling(true);
    setTimeout(() => {
      onInstall(extension.id);
      setInstalling(false);
    }, 800);
  };

  return (
    <div className={cn(
      'flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#1e1e2e] transition-all group',
      featured && 'mb-2 bg-[#1e1e2e] border border-[#313244]'
    )}>
      <div className="w-10 h-10 rounded-lg bg-[#313244] flex items-center justify-center text-lg flex-shrink-0">
        {extension.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#cdd6f4] truncate">{extension.name}</span>
          {featured && <span className="text-[8px] bg-[#89b4fa]/20 text-[#89b4fa] px-1 py-0.5 rounded font-medium">FEATURED</span>}
        </div>
        <p className="text-[10px] text-[#6c7086] line-clamp-1 mt-0.5">{extension.description}</p>
        <div className="flex items-center gap-2 mt-1">
          {renderStars(extension.rating)}
          <span className="text-[9px] text-[#45475a]">{extension.downloads}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-[#45475a] mt-0.5">
          <span>{extension.author}</span>
          <span>·</span>
          <span>v{extension.version}</span>
        </div>
      </div>
      <div className="flex-shrink-0 pt-0.5">
        {extension.state === 'installed' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(extension.id)}
              className={cn(
                'w-6 h-6 rounded flex items-center justify-center transition-all',
                extension.enabled
                  ? 'bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#94d6a0]'
                  : 'bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
              )}
              title={extension.enabled ? 'Disable' : 'Enable'}
            >
              {extension.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onUninstall(extension.id)}
              className="w-6 h-6 rounded flex items-center justify-center text-[#6c7086] hover:text-[#f38ba8] hover:bg-[#f38ba8]/10 transition-all opacity-0 group-hover:opacity-100"
              title="Uninstall"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="px-2.5 py-1 bg-[#89b4fa] hover:bg-[#b4d0fb] text-[#1e1e2e] text-[10px] font-medium rounded transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {installing ? (
              <>
                <div className="w-2.5 h-2.5 border border-[#1e1e2e] border-t-transparent rounded-full animate-spin" />
                Installing
              </>
            ) : (
              <>
                <Download className="w-2.5 h-2.5" />
                Install
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
