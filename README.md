<p align="center">
  <img src="https://img.shields.io/badge/CortexIDE-v0.2.0-blueviolet?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Version"/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

<h1 align="center">🧠 CortexIDE</h1>

<p align="center">
  <strong>The World's Most Advanced Open-Source, AI-Native Browser-Based IDE</strong><br/>
  Built to rival Cursor, Claude Code, and VS Code — entirely in the browser.
</p>

<p align="center">
  <a href="#features">✨ Features</a> •
  <a href="#architecture">🏗️ Architecture</a> •
  <a href="#getting-started">🚀 Getting Started</a> •
  <a href="#tech-stack">⚙️ Tech Stack</a> •
  <a href="#roadmap">🗺️ Roadmap</a>
</p>

---

## ✨ Features

### 🤖 AI-Native Code Intelligence
- **Multi-Model Support** — Anthropic Claude, OpenAI GPT-4, Google Gemini via direct SDK integration
- **28+ Specialized AI Agents** — Code reviewer, debugger, architect, refactoring, security auditor & more
- **7-Phase NEXUS Pipeline** — Plan → Design → Code → Review → Test → Optimize → Deploy
- **Inline AI Edit (Ctrl+K)** — Highlight code, get AI suggestions inline with diff overlay
- **Multi-Model Code Debate (Ctrl+Shift+K)** — 3 AI models debate the best approach side-by-side
- **Agentic Fix Loop** — Autonomous read → edit → run → verify → self-correct cycle
- **Codebase RAG** — Local embeddings with @xenova/transformers for context-aware suggestions
- **Anti-Fantasy QA** — AI verifies code correctness before suggesting changes

### 💻 Full IDE Experience
- **Monaco Editor** — VS Code's editor engine with syntax highlighting for 50+ languages
- **File Explorer** — Tree-based file browser with create/rename/delete operations
- **Integrated Terminal** — Real shell via node-pty + xterm.js with WebSocket transport
- **Git Integration** — Real git operations via isomorphic-git with diff view
- **Command Palette (Ctrl+Shift+P)** — Quick access to all IDE commands
- **Editor Tabs** — Multi-tab interface with drag-and-drop reordering
- **Search & Replace** — Cross-file search with regex support
- **Extensions Panel** — Manage IDE extensions and themes

### 📱 Mobile-First Design
- **Responsive Layout** — Full IDE experience on mobile and tablet
- **Mobile Navigation** — Touch-optimized bottom navigation bar
- **Mobile Code Editor** — On-screen keyboard-friendly code editing
- **AI Floating Button** — Quick AI access from any screen on mobile

### 🎨 Design System
- **Catppuccin Mocha Theme** — Beautiful dark theme by default
- **shadcn/ui Components** — 40+ polished, accessible UI components
- **Zustand State Management** — Lightweight, performant state handling

### 🔧 Developer Tools
- **Cost Tracker** — Real-time AI API usage monitoring per model and session
- **Agent Monitor** — Live view of all active AI agents and their progress
- **Notification Center** — IDE alerts, build status, and AI completions
- **Settings Dialog** — Full configuration for models, themes, keybindings

---

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── chat/           # AI Chat (streaming SSE)
│   │   ├── files/          # File CRUD operations
│   │   ├── git/            # Git operations
│   │   └── terminal/       # WebSocket terminal
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # IDE entry point
├── components/
│   └── ide/                # IDE Components
│       ├── AIPanel.tsx     # AI Chat & Agent interface
│       ├── CodeEditor.tsx  # Monaco Editor wrapper
│       ├── Terminal.tsx    # xterm.js terminal
│       ├── FileExplorer.tsx # File tree browser
│       ├── GitPanel.tsx    # Git status & diff
│       ├── CommandPalette.tsx
│       ├── EditorTabs.tsx
│       ├── SearchPanel.tsx
│       ├── ExtensionsPanel.tsx
│       ├── SettingsDialog.tsx
│       ├── AgentMonitor.tsx
│       ├── CostTracker.tsx
│       ├── StatusBar.tsx
│       ├── MobileNav.tsx
│       └── ...
├── lib/
│   ├── ai/                 # AI Engine
│   │   ├── providers.ts    # Multi-model SDK integration
│   │   ├── streaming.ts    # SSE streaming handlers
│   │   ├── agents/         # 28+ specialized agents
│   │   └── context.ts      # Token-aware context builder
│   ├── terminal/           # Terminal (node-pty)
│   ├── git/                # Git operations
│   ├── testing/            # Test runner
│   └── nexus/              # NEXUS pipeline & MCP
├── stores/                 # Zustand stores
│   ├── use-filesystem-store.ts
│   ├── use-editor-store.ts
│   ├── use-terminal-store.ts
│   └── use-ai-store.ts
└── styles/                 # Catppuccin Mocha theme
```

---

## 🚀 Getting Started

### Prerequisites
- **Bun** (v1.0+) — [Install Bun](https://bun.sh)
- **Node.js** (v20+) — For node-pty
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/erpriyanshuk-creator/CortexIDE.git
cd CortexIDE

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Setup database
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# AI Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_KEY=...

# Database
DATABASE_URL=file:./dev.db
```

---

## ⚙️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Catppuccin Mocha |
| Components | shadcn/ui (40+) |
| Editor | Monaco Editor |
| Terminal | node-pty + xterm.js |
| AI SDKs | @anthropic-ai/sdk, openai, @google/generative-ai |
| State | Zustand |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) |
| Git | isomorphic-git |
| Embeddings | @xenova/transformers |
| Package Manager | Bun |

---

## 🗺️ Roadmap

### v0.2 — Current
- [x] Multi-model AI chat (Claude, GPT-4, Gemini)
- [x] 28+ specialized AI agents
- [x] 7-phase NEXUS pipeline
- [x] Monaco code editor with 50+ languages
- [x] File explorer with tree view
- [x] Integrated terminal (node-pty)
- [x] Git integration (isomorphic-git)
- [x] Command palette (Ctrl+Shift+P)
- [x] Editor tabs with drag-and-drop
- [x] Mobile-responsive layout
- [x] Catppuccin Mocha theme
- [x] Cost tracking per model
- [x] Agent monitoring dashboard
- [x] Settings & configuration

### v0.3 — Upcoming
- [ ] Inline AI Edit (Ctrl+K) with diff overlay
- [ ] Multi-Model Code Debate (Ctrl+Shift+K)
- [ ] Agentic Fix Loop (autonomous debugging)
- [ ] Codebase RAG with local embeddings
- [ ] Collaborative editing (WebSocket-based CRDT)
- [ ] Extension marketplace
- [ ] Plugin API for custom agents
- [ ] Deployment targets (Vercel, Docker, Cloudflare)

### v1.0 — Vision
- [ ] Full offline mode (Service Worker + WASM)
- [ ] AI pair programming with live suggestions
- [ ] Natural language to code generation
- [ ] Built-in deployment pipeline
- [ ] Team collaboration features
- [ ] 500K+ lines of production code

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 🧠 by <strong>CortexIDE Team</strong><br/>
  <em>The future of AI-powered development, open for everyone.</em>
</p>
