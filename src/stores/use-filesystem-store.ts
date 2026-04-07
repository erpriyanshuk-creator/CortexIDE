import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileNode } from '@/lib/types';
import { getLanguageFromPath } from '@/lib/types';
import { generateId } from '@/lib/types';

// Sample project files
const SAMPLE_FILES: Record<string, string> = {
  'src/app/page.tsx': `'use client';

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Welcome to NexusIDE
        </h1>
        <p className="text-gray-400 text-lg">
          The world's most advanced AI-powered IDE
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition-colors"
          >
            Count: {count}
          </button>
        </div>
      </div>
    </div>
  );
}`,
  'src/app/layout.tsx': `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Next.js App",
  description: "Built with NexusIDE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
  'src/app/globals.css': `@import "tailwindcss";

:root {
  --background: #0a0a0f;
  --foreground: #e2e8f0;
}

body {
  background: var(--background);
  color: var(--foreground);
}`,
  'src/components/Button.tsx': `import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variants = {
      primary: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500",
      secondary: "bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500",
      ghost: "text-gray-300 hover:bg-gray-800 focus:ring-gray-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={\`\${baseStyles} \${variants[variant]} \${sizes[size]} \${className}\`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;`,
  'src/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
  'package.json': `{
  "name": "my-nexus-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
  'README.md': `# My NexusIDE Project

Welcome to your new project! This is a starter template created with **NexusIDE**.

## Getting Started

\`\`\`bash
npm run dev
\`\`\`

## Features

- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS
- 🤖 AI-powered code assistance
- 📱 Mobile responsive

Built with ❤️ using NexusIDE`,
  '.gitignore': `node_modules/
.next/
.env.local
.env*.local
out/
dist/`,
  '.env.example': `# Database
DATABASE_URL="postgresql://localhost:5432/mydb"

# AI Provider Keys
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""`,
};

function buildFileTree(): FileNode[] {
  const root: FileNode[] = [];
  const dirMap: Record<string, FileNode> = {};

  // Create directories first
  const paths = Object.keys(SAMPLE_FILES).sort();
  for (const filePath of paths) {
    const parts = filePath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (!dirMap[currentPath]) {
        const dirNode: FileNode = {
          id: generateId(),
          name: parts[i],
          type: 'directory',
          path: currentPath,
          children: [],
          isExpanded: true,
        };
        dirMap[currentPath] = dirNode;
        if (i === 0) {
          root.push(dirNode);
        } else {
          const parentPath = parts.slice(0, i).join('/');
          if (dirMap[parentPath]) {
            dirMap[parentPath].children!.push(dirNode);
          }
        }
      }
    }
  }

  // Add files
  for (const filePath of paths) {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    const fileNode: FileNode = {
      id: generateId(),
      name: fileName,
      type: 'file',
      path: filePath,
      content: SAMPLE_FILES[filePath],
      language: getLanguageFromPath(filePath),
    };

    if (parts.length === 1) {
      root.push(fileNode);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      if (dirMap[parentPath]) {
        dirMap[parentPath].children!.push(fileNode);
      }
    }
  }

  return root;
}

interface FileSystemStore {
  files: FileNode[];
  
  // Actions
  getFileByPath: (path: string) => FileNode | null;
  createFile: (parentPath: string, name: string, content?: string) => FileNode | null;
  createDirectory: (parentPath: string, name: string) => FileNode | null;
  deleteNode: (path: string) => void;
  renameNode: (path: string, newName: string) => void;
  updateFileContent: (path: string, content: string) => void;
  toggleExpand: (path: string) => void;
  findNode: (nodes: FileNode[], path: string) => FileNode | null;
  addNodeToTree: (nodes: FileNode[], parentPath: string, node: FileNode) => FileNode[];
  removeNodeFromTree: (nodes: FileNode[], path: string) => FileNode[];
}

export const useFileSystemStore = create<FileSystemStore>()(
  persist(
    (set, get) => ({
      files: buildFileTree(),

      getFileByPath: (path) => {
        return get().findNode(get().files, path);
      },

      findNode: (nodes, path) => {
        for (const node of nodes) {
          if (node.path === path) return node;
          if (node.children) {
            const found = get().findNode(node.children, path);
            if (found) return found;
          }
        }
        return null;
      },

      createFile: (parentPath, name, content = '') => {
        const newFile: FileNode = {
          id: generateId(),
          name,
          type: 'file',
          path: parentPath ? `${parentPath}/${name}` : name,
          content,
          language: getLanguageFromPath(name),
        };
        set((state) => ({
          files: state.addNodeToTree(state.files, parentPath, newFile),
        }));
        return newFile;
      },

      createDirectory: (parentPath, name) => {
        const newDir: FileNode = {
          id: generateId(),
          name,
          type: 'directory',
          path: parentPath ? `${parentPath}/${name}` : name,
          children: [],
          isExpanded: true,
        };
        set((state) => ({
          files: state.addNodeToTree(state.files, parentPath, newDir),
        }));
        return newDir;
      },

      deleteNode: (path) => {
        set((state) => ({
          files: state.removeNodeFromTree(state.files, path),
        }));
      },

      renameNode: (path, newName) => {
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.path === path) {
              const parts = path.split('/');
              parts[parts.length - 1] = newName;
              const newPath = parts.join('/');
              return {
                ...node,
                name: newName,
                path: newPath,
                children: node.children
                  ? node.children.map((child) => ({
                      ...child,
                      path: child.path.replace(path, newPath),
                    }))
                  : undefined,
              };
            }
            if (node.children) {
              return {
                ...node,
                children: updateInTree(node.children),
              };
            }
            return node;
          });
        };
        set((state) => ({ files: updateInTree(state.files) }));
      },

      updateFileContent: (path, content) => {
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.path === path) {
              return { ...node, content };
            }
            if (node.children) {
              return { ...node, children: updateInTree(node.children) };
            }
            return node;
          });
        };
        set((state) => ({ files: updateInTree(state.files) }));
      },

      toggleExpand: (path) => {
        const toggleInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.path === path) {
              return { ...node, isExpanded: !node.isExpanded };
            }
            if (node.children) {
              return { ...node, children: toggleInTree(node.children) };
            }
            return node;
          });
        };
        set((state) => ({ files: toggleInTree(state.files) }));
      },

      addNodeToTree: (nodes, parentPath, newNode) => {
        if (!parentPath) {
          return [...nodes, newNode];
        }
        return nodes.map((node) => {
          if (node.path === parentPath) {
            return {
              ...node,
              children: [...(node.children || []), newNode].sort((a, b) => {
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name);
              }),
            };
          }
          if (node.children) {
            return {
              ...node,
              children: get().addNodeToTree(node.children, parentPath, newNode),
            };
          }
          return node;
        });
      },

      removeNodeFromTree: (nodes, path) => {
        return nodes
          .filter((node) => node.path !== path)
          .map((node) => {
            if (node.children) {
              return {
                ...node,
                children: get().removeNodeFromTree(node.children, path),
              };
            }
            return node;
          });
      },
    }),
    {
      name: 'nexus-filesystem',
    }
  )
);
