'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  FolderPlus,
  Trash2,
  Pencil,
  FilePlus,
} from 'lucide-react';
import { useFileSystemStore } from '@/stores/use-filesystem-store';
import { useEditorStore } from '@/stores/use-editor-store';
import { getFileIcon, type FileNode } from '@/lib/types';
import { cn } from '@/lib/utils';

export function FileExplorer() {
  const files = useFileSystemStore((s) => s.files);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode | null;
    type: 'file' | 'directory' | 'root';
  } | null>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return (
    <div
      className="text-sm select-none"
      onClick={closeContextMenu}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node: null, type: 'root' });
      }}
    >
      {/* Project header */}
      <div className="px-3 py-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6c7086]">
        <ChevronDown className="w-3 h-3" />
        <span>my-nexus-project</span>
      </div>

      {/* File tree */}
      <div className="px-1">
        {files.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} onContextMenu={setContextMenu} />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenuPopup
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          type={contextMenu.type}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onContextMenu,
}: {
  node: FileNode;
  depth: number;
  onContextMenu: (menu: {
    x: number;
    y: number;
    node: FileNode | null;
    type: 'file' | 'directory' | 'root';
  }) => void;
}) {
  const { toggleExpand } = useFileSystemStore();
  const { openFile } = useEditorStore();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const isActive = activeTabId === node.id;

  const handleClick = () => {
    if (node.type === 'directory') {
      toggleExpand(node.path);
    } else {
      openFile(node.id, node.path, node.name, node.language || 'plaintext');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      type: node.type,
    });
  };

  const paddingLeft = depth * 12 + 8;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 h-7 px-2 rounded-md cursor-pointer transition-colors group',
          isActive
            ? 'bg-[#313244] text-[#cdd6f4]'
            : 'text-[#bac2de] hover:bg-[#1e1e2e]'
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse icon */}
        {node.type === 'directory' ? (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {node.isExpanded ? (
              <ChevronDown className="w-3 h-3 text-[#6c7086]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[#6c7086]" />
            )}
          </span>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        {/* File/Folder icon */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sm">
          {node.type === 'directory'
            ? node.isExpanded
              ? <FolderOpen className="w-4 h-4 text-[#89b4fa]" />
              : <Folder className="w-4 h-4 text-[#89b4fa]" />
            : <span className="text-xs">{getFileIcon(node.name)}</span>
          }
        </span>

        {/* Name */}
        <span className="truncate text-[13px]">{node.name}</span>
      </div>

      {/* Children */}
      {node.type === 'directory' && node.isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onContextMenu={onContextMenu}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function ContextMenuPopup({
  x,
  y,
  node,
  type,
  onClose,
}: {
  x: number;
  y: number;
  node: FileNode | null;
  type: 'file' | 'directory' | 'root';
  onClose: () => void;
}) {
  const { createFile, createDirectory, deleteNode, renameNode } = useFileSystemStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [renaming, setRenaming] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if ((isCreating || renaming) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, renaming]);

  const parentPath = node?.type === 'directory' ? node.path : node?.path.split('/').slice(0, -1).join('');

  const handleCreate = () => {
    if (newName.trim()) {
      if (createType === 'file') {
        createFile(parentPath, newName.trim());
      } else {
        createDirectory(parentPath, newName.trim());
      }
    }
    setIsCreating(false);
    setNewName('');
    onClose();
  };

  const handleRename = () => {
    if (node && newName.trim()) {
      renameNode(node.path, newName.trim());
    }
    setRenaming(false);
    setNewName('');
    onClose();
  };

  const handleDelete = () => {
    if (node) {
      deleteNode(node.path);
    }
    onClose();
  };

  const menuItems = type === 'root' || type === 'directory'
    ? [
        { icon: <FilePlus className="w-3.5 h-3.5" />, label: 'New File', action: () => { setIsCreating(true); setCreateType('file'); } },
        { icon: <FolderPlus className="w-3.5 h-3.5" />, label: 'New Folder', action: () => { setIsCreating(true); setCreateType('directory'); } },
      ]
    : [];

  if (node) {
    menuItems.push(
      { icon: <Pencil className="w-3.5 h-3.5" />, label: 'Rename', action: () => { setRenaming(true); setNewName(node.name); } },
      { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', action: handleDelete, danger: true }
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-2xl py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        {(isCreating || renaming) ? (
          <div className="px-2 py-1">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isCreating) {
                    handleCreate();
                  } else {
                    handleRename();
                  }
                }
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setRenaming(false);
                  onClose();
                }
              }}
              placeholder={createType === 'file' ? 'filename.tsx' : 'folder name'}
              className="w-full bg-[#181825] border border-[#313244] rounded px-2 py-1 text-sm text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
            />
          </div>
        ) : (
          menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                'danger' in item && item.danger
                  ? 'text-[#f38ba8] hover:bg-[#f38ba8]/10'
                  : 'text-[#cdd6f4] hover:bg-[#313244]'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))
        )}
      </div>
    </>
  );
}
