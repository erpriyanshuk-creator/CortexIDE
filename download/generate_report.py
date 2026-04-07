import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ========== Font Registration ==========
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ========== Colors ==========
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = colors.HexColor('#F5F5F5')
ACCENT_BLUE = colors.HexColor('#1F4E79')
ACCENT_LIGHT = colors.HexColor('#D6E4F0')
COVER_BG = colors.HexColor('#0D1B2A')

# ========== Styles ==========
cover_title_style = ParagraphStyle(
    name='CoverTitle', fontName='Times New Roman', fontSize=36,
    leading=44, alignment=TA_CENTER, spaceAfter=20, textColor=ACCENT_BLUE
)
cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle', fontName='Times New Roman', fontSize=18,
    leading=26, alignment=TA_CENTER, spaceAfter=12, textColor=colors.HexColor('#555555')
)
cover_author_style = ParagraphStyle(
    name='CoverAuthor', fontName='Times New Roman', fontSize=13,
    leading=20, alignment=TA_CENTER, spaceAfter=8, textColor=colors.HexColor('#666666')
)

h1_style = ParagraphStyle(
    name='H1', fontName='Times New Roman', fontSize=20,
    leading=28, spaceBefore=18, spaceAfter=10, textColor=colors.black
)
h2_style = ParagraphStyle(
    name='H2', fontName='Times New Roman', fontSize=15,
    leading=22, spaceBefore=14, spaceAfter=8, textColor=colors.HexColor('#1F4E79')
)
h3_style = ParagraphStyle(
    name='H3', fontName='Times New Roman', fontSize=12,
    leading=18, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor('#333333')
)
body_style = ParagraphStyle(
    name='Body', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_JUSTIFY, spaceAfter=6
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_LEFT, leftIndent=20, bulletIndent=8,
    spaceAfter=4, bulletFontName='Times New Roman', bulletFontSize=10.5
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8.5,
    leading=13, alignment=TA_LEFT, leftIndent=12, rightIndent=12,
    spaceAfter=6, backColor=colors.HexColor('#F0F4F8'),
    borderColor=colors.HexColor('#D0D8E0'), borderWidth=0.5,
    borderPadding=6
)
caption_style = ParagraphStyle(
    name='Caption', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_CENTER, textColor=colors.HexColor('#555555'),
    spaceBefore=3, spaceAfter=6
)
toc_h1_style = ParagraphStyle(
    name='TOCH1', fontName='Times New Roman', fontSize=13,
    leftIndent=20, leading=22
)
toc_h2_style = ParagraphStyle(
    name='TOCH2', fontName='Times New Roman', fontSize=11,
    leftIndent=40, leading=18
)

# Table cell styles
header_cell = ParagraphStyle(
    name='HeaderCell', fontName='Times New Roman', fontSize=10,
    textColor=colors.white, alignment=TA_CENTER, leading=14
)
body_cell = ParagraphStyle(
    name='BodyCell', fontName='Times New Roman', fontSize=9.5,
    textColor=colors.black, alignment=TA_LEFT, leading=13,
    wordWrap='CJK'
)
body_cell_c = ParagraphStyle(
    name='BodyCellC', fontName='Times New Roman', fontSize=9.5,
    textColor=colors.black, alignment=TA_CENTER, leading=13
)

# ========== TOC Template ==========
class TocDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        SimpleDocTemplate.__init__(self, *args, **kwargs)
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            self.notify('TOCEntry', (level, text, self.page))

def add_heading(text, style, level=0):
    p = Paragraph(text, style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text.replace('<b>', '').replace('</b>', '')
    return p

def make_table(data, col_widths):
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def P(text, style=body_style):
    return Paragraph(text, style)

def B(text):
    return Paragraph('<b>' + text + '</b>', body_style)

def bullet(text):
    return Paragraph('<bullet>•</bullet>' + text, bullet_style)

# ========== Build Document ==========
pdf_path = '/home/z/my-project/download/OpenClaude_Repository_Analysis.pdf'
doc = TocDocTemplate(
    pdf_path, pagesize=A4,
    leftMargin=2.2*cm, rightMargin=2.2*cm,
    topMargin=2.2*cm, bottomMargin=2.2*cm,
    title='OpenClaude Repository Analysis',
    author='Z.ai', creator='Z.ai',
    subject='Comprehensive technical analysis of the Gitlawb/openclaude open-source coding agent CLI repository'
)

story = []
W = A4[0] - 4.4*cm  # usable width

# ========== COVER PAGE ==========
story.append(Spacer(1, 100))
story.append(Paragraph('<b>OpenClaude Repository</b>', cover_title_style))
story.append(Paragraph('<b>Technical Analysis Report</b>', cover_title_style))
story.append(Spacer(1, 30))
story.append(Paragraph('Comprehensive Codebase Review and Architecture Assessment', cover_subtitle_style))
story.append(Spacer(1, 20))

# Cover info table
cover_data = [
    [P('<b>Repository</b>', body_cell_c), P('Gitlawb/openclaude', body_cell_c)],
    [P('<b>Version</b>', body_cell_c), P('0.1.8', body_cell_c)],
    [P('<b>Language</b>', body_cell_c), P('TypeScript (Core) + Python (Helpers)', body_cell_c)],
    [P('<b>License</b>', body_cell_c), P('MIT (modifications) / Anthropic Proprietary (derived)', body_cell_c)],
    [P('<b>Analysis Date</b>', body_cell_c), P('April 8, 2026', body_cell_c)],
]
cover_tbl = Table(cover_data, colWidths=[4*cm, 10*cm], hAlign='CENTER')
cover_tbl.setStyle(TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
    ('BACKGROUND', (0, 0), (0, -1), ACCENT_LIGHT),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(cover_tbl)
story.append(Spacer(1, 50))
story.append(Paragraph('Generated by Z.ai', cover_author_style))
story.append(PageBreak())

# ========== TABLE OF CONTENTS ==========
story.append(Paragraph('<b>Table of Contents</b>', h1_style))
story.append(Spacer(1, 12))
toc = TableOfContents()
toc.levelStyles = [toc_h1_style, toc_h2_style]
story.append(toc)
story.append(PageBreak())

# ========== 1. EXECUTIVE SUMMARY ==========
story.append(add_heading('<b>1. Executive Summary</b>', h1_style, 0))
story.append(P(
    'OpenClaude is an open-source coding-agent CLI tool that originated from Anthropic\'s Claude Code codebase '
    'and has been substantially modified to support multiple LLM providers beyond Anthropic\'s proprietary API. '
    'The project enables developers to use a single terminal-first workflow with over 200 compatible models, '
    'including OpenAI, Google Gemini, DeepSeek, Ollama (local models), GitHub Models, Codex, and various '
    'OpenAI-compatible API endpoints. The codebase is written primarily in TypeScript with a custom React-for-terminal '
    'UI framework built on a fork of Ink, and includes Python companion utilities for intelligent model routing.'
))
story.append(P(
    'The repository demonstrates a sophisticated architecture with 35+ built-in tools, multi-agent orchestration '
    'capabilities, a headless gRPC server mode, comprehensive security measures including sandbox execution and '
    'path traversal prevention, and a plugin system for extensibility. The build system leverages Bun with '
    'feature-flag-based dead code elimination to produce a single-file ESM bundle. The project has an active '
    'development history with recent commits focused on bug fixes, security hardening, and provider compatibility '
    'improvements. Notably, the license structure raises important legal considerations as the project contains '
    'code derived from Anthropic\'s proprietary Claude Code source without explicit authorization for distribution.'
))
story.append(Spacer(1, 6))
story.append(P('<b>Key Metrics:</b>'))
story.append(bullet('Version: 0.1.8 (active development, 20+ recent commits)'))
story.append(bullet('Core Language: TypeScript (target ES2022) with Bun runtime'))
story.append(bullet('Source Directories: 39 top-level modules under src/'))
story.append(bullet('Built-in Tools: 35+ tools including bash, file operations, web search, MCP, LSP'))
story.append(bullet('Supported Providers: 8+ (OpenAI, Gemini, Anthropic, Bedrock, Vertex, Foundry, Ollama, GitHub Models)'))
story.append(bullet('Test Files: 82 test files with Bun test runner'))
story.append(bullet('Dependencies: 75 production dependencies, 5 dev dependencies'))
story.append(bullet('Build Output: Single-file ESM bundle (dist/cli.mjs)'))
story.append(Spacer(1, 12))

# ========== 2. REPOSITORY OVERVIEW ==========
story.append(add_heading('<b>2. Repository Overview</b>', h1_style, 0))
story.append(add_heading('<b>2.1 Project Identity and Purpose</b>', h2_style, 1))
story.append(P(
    'OpenClaude (published as @gitlawb/openclaude on npm) positions itself as the open-source alternative to '
    'Anthropic\'s Claude Code CLI. The project\'s primary value proposition is provider agnosticism: it maintains '
    'the familiar Claude Code terminal workflow while allowing users to connect any OpenAI-compatible LLM backend. '
    'This includes cloud providers like OpenAI, Google Gemini, and DeepSeek, as well as local inference engines '
    'like Ollama, LM Studio, and Atomic Chat (Apple Silicon). The tool supports the full coding-agent feature set '
    'including bash execution, file read/write/edit, code search via ripgrep, glob pattern matching, multi-agent '
    'delegation, Model Context Protocol (MCP) integration, web search and fetch capabilities, and a headless '
    'gRPC server mode for programmatic integration.'
))
story.append(P(
    'The project is not affiliated with or endorsed by Anthropic, and the disclaimer explicitly states that "Claude" '
    'and "Claude Code" are trademarks of Anthropic PBC. The repository is hosted on GitHub at '
    'github.com/Gitlawb/openclaude and published under a dual licensing structure: modifications by OpenClaude '
    'contributors are offered under the MIT License where legally permissible, while the underlying derived code '
    'remains subject to Anthropic\'s copyright. This legal nuance is important and is acknowledged directly in the '
    'LICENSE file, which notes that "this project does not have Anthropic\'s authorization to distribute their '
    'proprietary source."'
))

story.append(add_heading('<b>2.2 Technology Stack</b>', h2_style, 1))
tech_data = [
    [P('<b>Component</b>', header_cell), P('<b>Technology</b>', header_cell), P('<b>Version</b>', header_cell)],
    [P('Runtime', body_cell), P('Bun', body_cell_c), P('Latest', body_cell_c)],
    [P('Language', body_cell), P('TypeScript', body_cell_c), P('5.9.3', body_cell_c)],
    [P('Target', body_cell), P('ES2022 / ESM', body_cell_c), P('-', body_cell_c)],
    [P('UI Framework', body_cell), P('Custom Ink fork + React 19', body_cell_c), P('19.2.4', body_cell_c)],
    [P('Layout Engine', body_cell), P('Yoga (CSS Flexbox)', body_cell_c), P('Internal', body_cell_c)],
    [P('CLI Framework', body_cell), P('Commander.js', body_cell_c), P('12.1.0', body_cell_c)],
    [P('Schema Validation', body_cell), P('Zod', body_cell_c), P('3.25.76', body_cell_c)],
    [P('Core SDK', body_cell), P('Anthropic SDK', body_cell_c), P('0.81.0', body_cell_c)],
    [P('Test Runner', body_cell), P('Bun built-in test', body_cell_c), P('-', body_cell_c)],
    [P('gRPC', body_cell), P('@grpc/grpc-js', body_cell_c), P('^1.14.3', body_cell_c)],
    [P('MCP', body_cell), P('@modelcontextprotocol/sdk', body_cell_c), P('1.29.0', body_cell_c)],
]
story.append(Spacer(1, 12))
story.append(make_table(tech_data, [3.5*cm, 6.5*cm, 3.5*cm]))
story.append(Spacer(1, 4))
story.append(P('<b>Table 1.</b> Primary Technology Stack', caption_style))
story.append(Spacer(1, 12))

# ========== 3. ARCHITECTURE ANALYSIS ==========
story.append(add_heading('<b>3. Architecture Analysis</b>', h1_style, 0))
story.append(add_heading('<b>3.1 High-Level Architecture</b>', h2_style, 1))
story.append(P(
    'OpenClaude follows a modular, event-driven architecture built on a reactive UI paradigm. The application '
    'uses a custom fork of Ink, which provides a React reconciler for terminal environments, enabling the entire '
    'CLI interface to be composed of React components rendered to the terminal via the Yoga layout engine. This '
    'architecture decision is significant: it allows the codebase to leverage React\'s component model, hooks '
    'system, and state management patterns for a terminal application, providing a rich interactive experience '
    'that includes spinners, progress bars, fuzzy pickers, tabbed interfaces, virtual scrolling, and markdown '
    'rendering, all within a text-based terminal.'
))
story.append(P(
    'The core execution flow follows a well-defined path: the CLI entry point performs fast-path routing for '
    'simple commands (like --version), then loads the full application which sets up a Commander.js-based CLI '
    'with 80+ subcommands. The main REPL screen connects to the QueryEngine, which manages the primary loop of '
    'LLM API calls, tool execution, and response streaming. The streaming architecture uses async generators, '
    'allowing real-time token-by-token output to be rendered as it arrives from the provider API. State '
    'management follows React patterns with a centralized store in src/state/, and context is propagated through '
    'React contexts for notifications, modal state, voice mode, and other cross-cutting concerns.'
))

story.append(add_heading('<b>3.2 Execution Flow</b>', h2_style, 1))
flow_text = (
    '<b>1. Entry Point:</b> bin/openclaude checks for the built artifact (dist/cli.mjs), falls back to '
    'triggering a build. The entry script is minimal, delegating to src/entrypoints/cli.tsx for bootstrapping.<br/><br/>'
    '<b>2. Bootstrap:</b> cli.tsx performs fast-path checks for --version, --provider flags, Chrome integration '
    'modes, bridge/daemon modes, and background session management commands. If none match, it loads the full '
    'main.tsx module.<br/><br/>'
    '<b>3. Main Module:</b> main.tsx (~730 lines) is the monolithic entry that handles Commander.js CLI setup, '
    'system prompt construction, tool assembly, REPL launch, session management, authentication flow, model '
    'resolution, provider setup, migration execution, and preference prefetching.<br/><br/>'
    '<b>4. REPL Loop:</b> The REPL screen (src/screens/REPL.tsx) connects user input to the QueryEngine, which '
    'submits messages to the configured LLM provider and processes the streaming response through the tool '
    'execution loop.<br/><br/>'
    '<b>5. Tool Execution:</b> When the LLM response contains tool calls, each tool is executed through the '
    'permission system, results are collected, and a follow-up API call is made with the tool results appended '
    'to the conversation. This loop continues until the LLM provides a final text response without tool calls.'
)
story.append(P(flow_text))
story.append(Spacer(1, 8))

story.append(add_heading('<b>3.3 Key Design Patterns</b>', h2_style, 1))
patterns_data = [
    [P('<b>Pattern</b>', header_cell), P('<b>Application</b>', header_cell), P('<b>Location</b>', header_cell)],
    [P('Adapter', body_cell), P('Translates Anthropic SDK calls to OpenAI-compatible format for 200+ models', body_cell), P('src/services/api/openaiShim.ts', body_cell)],
    [P('Factory', body_cell), P('buildTool() creates tools with safe defaults (fail-closed)', body_cell), P('src/Tool.ts', body_cell)],
    [P('Strategy', body_cell), P('Provider selection via env vars; SmartRouter in Python for auto-routing', body_cell), P('src/services/api/client.ts', body_cell)],
    [P('Observer/Event', body_cell), P('Async generator yield for streaming LLM responses and tool progress', body_cell), P('src/query/', body_cell)],
    [P('Plugin', body_cell), P('Dynamic tool loading, marketplace, versioning, and policy enforcement', body_cell), P('src/plugins/, src/utils/plugins/', body_cell)],
    [P('Migration', body_cell), P('11 versioned migrations run at startup to evolve settings schema', body_cell), P('src/migrations/', body_cell)],
    [P('Dead Code Elim.', body_cell), P('Build-time feature flags strip internal-only code from open build', body_cell), P('scripts/build.ts', body_cell)],
    [P('React for CLI', body_cell), P('Full React component tree rendered to terminal via custom Ink fork', body_cell), P('src/ink/', body_cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(patterns_data, [3*cm, 7.5*cm, 5.5*cm]))
story.append(Spacer(1, 4))
story.append(P('<b>Table 2.</b> Key Design Patterns Identified in the Codebase', caption_style))
story.append(Spacer(1, 12))

# ========== 4. PROVIDER SYSTEM ==========
story.append(add_heading('<b>4. Multi-Provider System</b>', h1_style, 0))
story.append(add_heading('<b>4.1 Provider Abstraction Layer</b>', h2_style, 1))
story.append(P(
    'The provider system is the most architecturally significant component of OpenClaude, as it enables the '
    'project\'s core value proposition of provider-agnostic LLM access. The abstraction is implemented through '
    'the Adapter pattern: regardless of which provider is configured, the application code interacts with a '
    'duck-typed Anthropic SDK client. This means all internal logic (tool calling, streaming, message formatting) '
    'uses Anthropic SDK conventions, and the translation to other provider formats happens at the boundary.'
))
story.append(P(
    'The central factory function getAnthropicClient() in src/services/api/client.ts examines environment '
    'variables to determine which provider to instantiate. For Anthropic-native backends, it returns a standard '
    'Anthropic SDK client. For all other providers, it delegates to createOpenAIShimClient(), which wraps an '
    'OpenAI-compatible API endpoint with a translation layer that converts Anthropic-format messages and tool '
    'schemas into OpenAI Chat Completion format, and then translates the streaming SSE response back into '
    'Anthropic stream events. This design means that adding support for a new OpenAI-compatible provider '
    'typically requires only setting the correct base URL and API key, with no code changes needed.'
))

story.append(add_heading('<b>4.2 OpenAI Shim Translation Layer</b>', h2_style, 1))
story.append(P(
    'The OpenAI Shim (src/services/api/openaiShim.ts, approximately 1,150 lines) is the critical translation '
    'component that makes the multi-provider system work. It handles several complex translation tasks: '
    'converting Anthropic\'s message format (which uses separate content blocks for text and tool use) into '
    'OpenAI\'s Chat Completion format (which uses a simpler role-based message structure with function calling); '
    'normalizing tool schemas between Anthropic\'s input_schema format and OpenAI\'s function definitions; '
    'translating streaming SSE responses from OpenAI format back into Anthropic stream events; handling '
    'reasoning and thinking blocks for providers like Gemini that use thought_signature fields; performing JSON '
    'repair on truncated tool call arguments that can occur when providers impose output length limits; and '
    'passing through content safety filter responses from Gemini and Azure OpenAI.'
))
story.append(P(
    'The shim also includes provider-specific handling for edge cases. For example, it has special logic for '
    'Codex authentication (reading from ~/.codex/auth.json), GitHub Models token handling, and different '
    'base URL conventions for each provider. When agent routing is active and an agent is configured to use a '
    'different model, the shim strips Authorization and x-api-key headers before forwarding requests to '
    'third-party endpoints, providing SSRF (Server-Side Request Forgery) protection.'
))

story.append(add_heading('<b>4.3 Supported Providers</b>', h2_style, 1))
provider_data = [
    [P('<b>Provider</b>', header_cell), P('<b>Setup Method</b>', header_cell), P('<b>Protocol</b>', header_cell), P('<b>Key Feature</b>', header_cell)],
    [P('Anthropic', body_cell_c), P('Env vars / default', body_cell), P('Native SDK', body_cell_c), P('Full feature set', body_cell)],
    [P('OpenAI', body_cell_c), P('/provider or env vars', body_cell), P('OpenAI API', body_cell_c), P('GPT-4o, o1, etc.', body_cell)],
    [P('Google Gemini', body_cell_c), P('/provider or env vars', body_cell), P('OpenAI compat.', body_cell_c), P('API key / ADC', body_cell)],
    [P('GitHub Models', body_cell_c), P('/onboard-github', body_cell), P('GitHub API', body_cell_c), P('Interactive setup', body_cell)],
    [P('Codex', body_cell_c), P('/provider', body_cell), P('Codex auth', body_cell_c), P('Existing creds', body_cell)],
    [P('Ollama', body_cell_c), P('/provider or env vars', body_cell), P('OpenAI compat.', body_cell_c), P('Local, no key', body_cell)],
    [P('AWS Bedrock', body_cell_c), P('Env vars', body_cell), P('Bedrock SDK', body_cell_c), P('Enterprise AWS', body_cell)],
    [P('GCP Vertex AI', body_cell_c), P('Env vars', body_cell), P('Vertex SDK', body_cell_c), P('GCP native', body_cell)],
    [P('Azure Foundry', body_cell_c), P('Env vars', body_cell), P('Foundry SDK', body_cell_c), P('Azure hosting', body_cell)],
    [P('Atomic Chat', body_cell_c), P('Advanced setup', body_cell), P('Local', body_cell_c), P('Apple Silicon', body_cell)],
    [P('LM Studio', body_cell_c), P('Env vars', body_cell), P('OpenAI compat.', body_cell_c), P('Local GUI server', body_cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(provider_data, [2.8*cm, 3.5*cm, 3*cm, 4.5*cm]))
story.append(Spacer(1, 4))
story.append(P('<b>Table 3.</b> Supported LLM Providers and Their Characteristics', caption_style))
story.append(Spacer(1, 12))

# ========== 5. TOOL SYSTEM ==========
story.append(add_heading('<b>5. Tool System</b>', h1_style, 0))
story.append(add_heading('<b>5.1 Tool Architecture</b>', h2_style, 1))
story.append(P(
    'The tool system is the operational core of OpenClaude\'s coding-agent capabilities. Each tool implements a '
    'comprehensive interface defined in src/Tool.ts (approximately 803 lines) that includes not just execution '
    'logic but also metadata, permission checks, validation, UI rendering, and concurrency safety annotations. '
    'The interface is designed with security in mind: every tool must declare whether it is read-only, '
    'destructive, concurrency-safe, and what permission level it requires. The buildTool() factory applies '
    'fail-closed defaults, meaning tools are assumed to be destructive and require permission unless explicitly '
    'marked otherwise.'
))
story.append(P(
    'The tool registry in src/tools.ts manages tool discovery, filtering, and assembly. It supports filtering '
    'by permission context (e.g., plan mode restricts available tools), deny rules (e.g., security policies '
    'blocking certain tools), and enabled state. The registry also handles tool deduplication when combining '
    'built-in tools with MCP-provided tools, which is important because MCP servers may expose tools with the '
    'same names as built-in tools. The assembled tool pool is then passed to the LLM as function definitions, '
    'enabling the model to invoke tools as part of its reasoning process.'
))

story.append(add_heading('<b>5.2 Built-in Tools</b>', h2_style, 1))
tools_data = [
    [P('<b>Tool</b>', header_cell), P('<b>Directory</b>', header_cell), P('<b>Description</b>', header_cell)],
    [P('AgentTool', body_cell), P('src/tools/AgentTool/', body_cell), P('Spawns sub-agents (sync, async, fork, teammate)', body_cell)],
    [P('BashTool', body_cell), P('src/tools/BashTool/', body_cell), P('Shell command execution with security sandbox', body_cell)],
    [P('FileEditTool', body_cell), P('src/tools/FileEditTool/', body_cell), P('Find-replace file editing', body_cell)],
    [P('FileReadTool', body_cell), P('src/tools/FileReadTool/', body_cell), P('File reading with image processing', body_cell)],
    [P('FileWriteTool', body_cell), P('src/tools/FileWriteTool/', body_cell), P('File creation and overwrite', body_cell)],
    [P('GlobTool', body_cell), P('src/tools/GlobTool/', body_cell), P('File pattern matching', body_cell)],
    [P('GrepTool', body_cell), P('src/tools/GrepTool/', body_cell), P('Content search via ripgrep wrapper', body_cell)],
    [P('WebFetchTool', body_cell), P('src/tools/WebFetchTool/', body_cell), P('Web page fetching (Firecrawl)', body_cell)],
    [P('WebSearchTool', body_cell), P('src/tools/WebSearchTool/', body_cell), P('Web search (DuckDuckGo fallback)', body_cell)],
    [P('LSPTool', body_cell), P('src/tools/LSPTool/', body_cell), P('Language Server Protocol integration', body_cell)],
    [P('MCPTool', body_cell), P('src/tools/MCPTool/', body_cell), P('Model Context Protocol bridge', body_cell)],
    [P('NotebookEditTool', body_cell), P('src/tools/NotebookEditTool/', body_cell), P('Jupyter notebook cell editing', body_cell)],
    [P('PowerShellTool', body_cell), P('src/tools/PowerShellTool/', body_cell), P('Windows PowerShell command execution', body_cell)],
    [P('TaskCreate/Get/Update', body_cell), P('src/tools/Task*/', body_cell), P('Task lifecycle CRUD operations', body_cell)],
    [P('TeamCreate/Delete', body_cell), P('src/tools/Team*/', body_cell), P('Multi-agent team management', body_cell)],
    [P('SkillTool', body_cell), P('src/tools/SkillTool/', body_cell), P('Skill plugin execution', body_cell)],
    [P('ScheduleCronTool', body_cell), P('src/tools/ScheduleCronTool/', body_cell), P('Cron job scheduling', body_cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(tools_data, [3.5*cm, 4*cm, 8.5*cm]))
story.append(Spacer(1, 4))
story.append(P('<b>Table 4.</b> Key Built-in Tools in OpenClaude', caption_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>5.3 Tool Security Model</b>', h2_style, 1))
story.append(P(
    'The security model for tool execution is multi-layered and comprehensive. The BashTool, which is the most '
    'security-sensitive tool, includes command classification (read-only vs. write vs. destructive), path '
    'traversal prevention, permission mode-aware approval workflows, sandbox mode detection, sed command parsing '
    'security, and mode-specific validation. Commands are classified into risk categories before execution, '
    'and destructive commands (like rm -rf, git push --force, etc.) trigger explicit user confirmation prompts. '
    'The path validation module prevents directory traversal attacks by normalizing and validating file paths '
    'before any file system operations.'
))
story.append(P(
    'The permission system supports multiple modes: "default" requires approval for destructive operations, '
    '"acceptEdits" auto-approves file edits but still prompts for bash commands, "bypassPermissions" skips all '
    'checks (for CI environments), "plan" restricts to read-only tools, and "auto" makes decisions based on '
    'learned patterns. These modes can be configured per-session and per-agent, allowing fine-grained control '
    'over what each agent is permitted to do. The system also includes a trust dialog that must be acknowledged '
    'before the first git or system operation in interactive mode, ensuring users understand the implications of '
    'granting tool permissions.'
))

# ========== 6. AGENT SYSTEM ==========
story.append(add_heading('<b>6. Agent System and Multi-Agent Orchestration</b>', h1_style, 0))
story.append(add_heading('<b>6.1 Agent Architecture</b>', h2_style, 1))
story.append(P(
    'The AgentTool (src/tools/AgentTool/AgentTool.tsx, approximately 800+ lines) is the most complex tool in '
    'the system and forms the backbone of OpenClaude\'s multi-agent capabilities. It supports five distinct '
    'subagent execution modes, each designed for different use cases. Sync agents block the parent\'s turn and '
    'return the result inline, suitable for simple subtasks that need immediate results. Async or background '
    'agents run independently and notify the parent upon completion, useful for long-running tasks. Fork '
    'subagents clone the parent\'s conversation context, enabling cache-identical API requests for parallel '
    'execution. Teammates are named agents within multi-agent teams that communicate through inter-agent '
    'messaging, backed by either tmux sessions or in-process execution. Remote agents are delegated to CCR '
    '(container) environments for isolated execution.'
))
story.append(P(
    'The system includes six built-in agents: an Explore agent for codebase navigation and understanding, a '
    'Plan agent for task decomposition and strategy, a Verification agent for testing and validation, a '
    'General Purpose agent for flexible task handling, a Statusline Setup agent for terminal configuration, '
    'and a Claude Code Guide agent for usage assistance. Each agent has its own system prompt, tool pool, and '
    'permission context. Agent isolation can be achieved through git worktrees (for filesystem isolation) or '
    'remote CCR containers (for full process isolation). The agent memory system provides persistent state '
    'across agent invocations through memory snapshots.'
))

story.append(add_heading('<b>6.2 Agent Routing</b>', h2_style, 1))
story.append(P(
    'OpenClaude supports routing different agents to different models through a settings-based configuration '
    'system. This feature is particularly valuable for cost optimization and quality tuning, as it allows '
    'users to direct exploration and analysis tasks to cheaper, faster models while reserving premium models '
    'for planning and code generation. The routing configuration is stored in ~/.claude/settings.json and maps '
    'agent names to model configurations, including base URLs and API keys. When no routing match is found, '
    'the global provider configuration serves as the fallback. This design enables sophisticated multi-model '
    'workflows where different agents can have different capabilities, cost profiles, and latency characteristics, '
    'all coordinated within a single session.'
))
story.append(Spacer(1, 12))

# ========== 7. UI AND RENDERING ==========
story.append(add_heading('<b>7. UI and Rendering System</b>', h1_style, 0))
story.append(P(
    'The UI layer is one of the most technically impressive aspects of OpenClaude. It is built on a complete '
    'custom fork of Ink (src/ink/) that provides a React reconciler for terminal environments. This fork '
    'includes a Yoga-based layout engine that implements CSS Flexbox in the terminal, full ANSI/VT100 terminal '
    'I/O parsing (handling escape sequences, OSC commands, DEC private modes), a comprehensive event system '
    'for keyboard, mouse click, focus, and terminal resize events, and core rendering primitives including Box, '
    'Text, ScrollBox, and Link components. The log-update mechanism ensures efficient screen redraws by only '
    'updating changed portions of the terminal output.'
))
story.append(P(
    'Built on top of this foundation, the component library (src/components/) provides a rich set of UI widgets: '
    'message renderers for different content types (text, tool use, thinking blocks, plans), animated spinners '
    'with shimmer and glimmer effects, inline diff viewers, virtual scrolling for long conversations, text '
    'input with Vim mode support, markdown rendering in the terminal, an interactive model picker with search, '
    'settings panels with tabbed interfaces, MCP server browser with tool lists and detail views, a fuzzy '
    'picker component, progress bars, dialogs, and multi-step wizard patterns. The design system (src/components/'
    'design-system/) provides reusable primitives like Dialog, Pane, Tabs, FuzzyPicker, and ProgressBar that '
    'maintain visual consistency across the application.'
))
story.append(P(
    'The rendering approach also includes specialized components for multi-agent team management dialogs, '
    'diff viewer dialogs, settings panels (Config, Usage, Status, Codex tabs), MCP server configuration UI '
    'with elicitation dialogs, and shell output rendering. The Spinner subsystem alone consists of 11 files '
    'implementing various animation effects. This level of UI sophistication is unusual for a CLI application '
    'and demonstrates the power of the React-for-terminal approach.'
))
story.append(Spacer(1, 12))

# ========== 8. gRPC SERVER ==========
story.append(add_heading('<b>8. Headless gRPC Server</b>', h1_style, 0))
story.append(P(
    'OpenClaude includes a headless gRPC server mode (src/grpc/server.ts, 252 lines) that enables programmatic '
    'integration of its agentic capabilities into external applications, CI/CD pipelines, or custom user '
    'interfaces. The server uses bidirectional streaming via the AgentService.Chat RPC method defined in '
    'src/proto/openclaude.proto. The protocol defines three client-to-server message types: ChatRequest (containing '
    'the user message, working directory, model specification, and session ID), UserInput (for replying to '
    'permission prompts with a prompt ID reference), and CancelSignal (for aborting in-progress operations). '
    'Server-to-client messages include TextChunk (real-time token output), ToolCallStart, ToolCallResult, '
    'ActionRequired (permission prompts), FinalResponse (complete response with token counts), and ErrorResponse.'
))
story.append(P(
    'The server maintains session persistence through an in-memory map (up to 1,000 sessions with LRU eviction), '
    'enabling multi-turn conversations. The tool permission flow is particularly well-designed: when a tool '
    'requires user approval, the server streams an action_required event to the client and waits for a UserInput '
    'response before proceeding. This allows the gRPC client to present the same interactive permission prompts '
    'that the CLI would show, maintaining the safety model in headless mode. The proto file can be used to '
    'generate clients in any language (Python, Go, Rust, etc.), making OpenClaude\'s capabilities accessible '
    'beyond the Node.js/TypeScript ecosystem.'
))
story.append(Spacer(1, 12))

# ========== 9. BUILD SYSTEM ==========
story.append(add_heading('<b>9. Build System and Development Workflow</b>', h1_style, 0))
story.append(P(
    'The build system (scripts/build.ts, approximately 400 lines) is a sophisticated Bun-based pipeline that '
    'produces a single-file ESM bundle from the entry point src/entrypoints/cli.tsx to dist/cli.mjs. The '
    'build process incorporates several custom Bun plugins that perform critical transformations. The No-Telemetry '
    'Plugin strips analytics sinks from the bundle, ensuring the open build does not phone home. The feature() '
    'macro from bun:bundle is replaced with a runtime flag checker, enabling build-time dead code elimination '
    'for features not available in the open build (voice mode, proactive features, bridge mode, daemon mode, '
    'etc.). An Internal Feature Stubber provides stub implementations for features like daemon mode, background '
    'sessions, and template jobs that are not available in the community build. The React Compiler Shim provides '
    'the c() function required by the React compiler runtime.'
))
story.append(P(
    'The build also handles native module stubbing (sharp, sandbox-runtime, mcpb, etc. are replaced with '
    'proxy-based stubs since they cannot be bundled), external dependency management (sharp, AWS SDK, Azure '
    'Identity, google-auth-library, and OpenTelemetry packages are kept external), and version injection via '
    'MACRO.VERSION (internal: 99.0.0) and MACRO.DISPLAY_VERSION (actual: 0.1.8). A Missing Module Scanner '
    'pre-scans the source code to find unresolved imports and auto-generates stubs, preventing runtime errors '
    'from accidentally referencing stripped features. The development workflow supports both source-build mode '
    '(bun install, bun run build, node dist/cli.mjs) and rapid development with bun run dev.'
))
story.append(Spacer(1, 12))

# ========== 10. SECURITY ANALYSIS ==========
story.append(add_heading('<b>10. Security Analysis</b>', h1_style, 0))
story.append(P(
    'OpenClaude implements a comprehensive set of security measures that reflect the sensitive nature of a tool '
    'that can execute arbitrary shell commands, modify files, and interact with external APIs. The security '
    'posture can be categorized into several layers: process-level protection, network security, filesystem '
    'safety, command execution sandboxing, and supply chain verification.'
))

sec_data = [
    [P('<b>Security Measure</b>', header_cell), P('<b>Category</b>', header_cell), P('<b>Implementation</b>', header_cell)],
    [P('Windows PATH hijack prevention', body_cell), P('Process', body_cell), P('NoDefaultCurrentDirectoryInExePath = 1', body_cell)],
    [P('Anti-debug protection', body_cell), P('Process', body_cell), P('Refuses to start under Node.js inspector', body_cell)],
    [P('ptrace protection', body_cell), P('Process', body_cell), P('prctl(PR_SET_DUMPABLE, 0) in CCR proxy', body_cell)],
    [P('SSRF prevention', body_cell), P('Network', body_cell), P('Strips auth headers in agent routing', body_cell)],
    [P('Path traversal prevention', body_cell), P('Filesystem', body_cell), P('pathValidation.ts for all file tools', body_cell)],
    [P('Destructive command detection', body_cell), P('Execution', body_cell), P('Command classification and warnings', body_cell)],
    [P('Sandbox execution', body_cell), P('Execution', body_cell), P('@anthropic-ai/sandbox-runtime integration', body_cell)],
    [P('CVE-2024-27822 protection', body_cell), P('Supply Chain', body_cell), P('COREPACK_ENABLE_AUTO_PIN = 0', body_cell)],
    [P('PEM validation', body_cell), P('Network', body_cell), P('isValidPemContent() guards', body_cell)],
    [P('No-phone-home verification', body_cell), P('Privacy', body_cell), P('scripts/verify-no-phone-home.ts', body_cell)],
    [P('PR intent scanning', body_cell), P('Supply Chain', body_cell), P('scripts/pr-intent-scan.ts', body_cell)],
    [P('Permission modes', body_cell), P('Execution', body_cell), P('default/acceptEdits/bypass/plan/auto', body_cell)],
]
story.append(Spacer(1, 12))
story.append(make_table(sec_data, [4.5*cm, 2.5*cm, 7.5*cm]))
story.append(Spacer(1, 4))
story.append(P('<b>Table 5.</b> Security Measures Implemented in OpenClaude', caption_style))
story.append(Spacer(1, 12))

# ========== 11. TESTING AND QUALITY ==========
story.append(add_heading('<b>11. Testing and Quality Assurance</b>', h1_style, 0))
story.append(P(
    'The project uses Bun\'s built-in test runner with 82 test files covering various aspects of the codebase. '
    'The test suite includes unit tests for bash mode validation, sed parsing, shell result mapping, skill tool '
    'operations, domain checking for WebFetch, provider detection and configuration, OpenAI shim translation, '
    'Codex shim behavior, proxy relay functionality, REPL input handling, memory scanning, and many other '
    'components. Coverage can be generated with bun test --coverage using the LCOV reporter, and the project '
    'includes a custom script (scripts/render-coverage-heatmap.ts) that generates a git-activity-style '
    'heatmap visualization of coverage at coverage/index.html.'
))
story.append(P(
    'The quality assurance toolchain extends beyond unit tests. The smoke test (bun run smoke) performs a '
    'build-and-verify check that the CLI starts correctly. The doctor:runtime command performs comprehensive '
    'environment checks including provider reachability, runtime dependencies, and configuration validation. '
    'The hardening:check command combines smoke tests with the runtime doctor, while hardening:strict adds '
    'TypeScript type checking. The security:pr-scan script analyzes pull requests for security intent, and '
    'verify:privacy confirms the built artifact does not contain telemetry or phone-home functionality. The '
    'typecheck command runs TypeScript compiler checks with strict mode enabled. This multi-layered approach '
    'to quality assurance reflects a mature development process.'
))
story.append(Spacer(1, 12))

# ========== 12. EXTENSIONS AND COMPANIONS ==========
story.append(add_heading('<b>12. Extensions and Companion Components</b>', h1_style, 0))
story.append(add_heading('<b>12.1 VS Code Extension</b>', h2_style, 1))
story.append(P(
    'The repository includes a VS Code extension (vscode-extension/openclaude-vscode/) published as '
    'openclaude-vscode v0.1.1, written in plain JavaScript (not TypeScript). The extension provides six '
    'commands: Launch in Terminal, Launch in Workspace Root, Open Documentation, Open Setup Guide, Open '
    'Workspace Profile, and Open Control Center. It adds a custom icon to the VS Code activity bar and '
    'provides a Control Center webview panel for management. Configuration settings allow users to customize '
    'the launch command, terminal name, and whether to use the OpenAI shim. The extension also includes a '
    'custom color theme called "OpenClaude Terminal Black." It activates on startup completion and supports '
    'command-based activation for on-demand loading.'
))

story.append(add_heading('<b>12.2 Python Companion Utilities</b>', h2_style, 1))
story.append(P(
    'The python/ directory contains three Python modules that complement the TypeScript core. The most '
    'significant is smart_router.py, which implements an intelligent multi-provider auto-router with latency '
    'and cost scoring. At startup, it pings all configured providers (OpenAI, Gemini, Ollama, AtomicChat) '
    'and scores them using the formula: 0.5 * latency + 0.5 * cost + error_rate * 500. The router supports '
    'three strategies (latency, cost, balanced) and includes automatic health checks with re-pinging of '
    'unhealthy providers after 60 seconds. It maps Claude model tiers to provider-specific models. The '
    'ollama_provider.py and atomic_chat_provider.py modules provide local model provider interfaces with '
    'proper error handling and model discovery. The Python tests use pytest with conftest fixtures.'
))
story.append(Spacer(1, 12))

# ========== 13. LEGAL CONSIDERATIONS ==========
story.append(add_heading('<b>13. Legal and Licensing Considerations</b>', h1_style, 0))
story.append(P(
    'The licensing structure of OpenClaude requires careful attention and represents a significant risk factor '
    'for potential users and contributors. The LICENSE file explicitly states that the repository contains '
    'code derived from Anthropic\'s Claude Code CLI, which is proprietary software copyrighted by Anthropic PBC '
    'and subject to Anthropic\'s Commercial Terms of Service. The file further acknowledges that "this project '
    'does not have Anthropic\'s authorization to distribute their proprietary source" and advises that "users '
    'and contributors should evaluate their own legal position."'
))
story.append(P(
    'Modifications and additions by OpenClaude contributors are offered under the MIT License where legally '
    'permissible, but the underlying derived code remains subject to Anthropic\'s copyright. This creates a '
    'complex legal situation where the MIT-licensed modifications sit on top of what may be an unauthorized '
    'distribution of proprietary code. Organizations considering using OpenClaude should consult with legal '
    'counsel to assess the risks, particularly around intellectual property, terms of service compliance, and '
    'potential liability. The npm package is published with "SEE LICENSE FILE" as the license identifier, '
    'which is intentionally non-specific and requires users to read and understand the full license text.'
))
story.append(Spacer(1, 12))

# ========== 14. RECENT DEVELOPMENT ==========
story.append(add_heading('<b>14. Recent Development Activity</b>', h1_style, 0))
story.append(P(
    'Analysis of the 20 most recent commits reveals an active and responsive development team focused on '
    'stability, security, and provider compatibility. Recent work includes fixing Grep and Glob reliability on '
    'OpenAI provider paths, addressing Gemini-specific errors with thought_signature handling in function calls, '
    'normalizing malformed Bash tool arguments from OpenAI-compatible providers, and resolving issues with '
    'reasoning models (like GLM-5) appearing to hang through the OpenAI shim. The team has also implemented '
    'security code scanning fixes, improved GitHub provider lifecycle and onboarding, added headless gRPC '
    'server support, and included MCP tool results in microcompact operations to reduce token waste. '
    'Documentation improvements include adding a LiteLLM proxy setup guide. The commit history shows a pattern '
    'of responsive bug fixing, security hardening, and incremental feature additions.'
))
story.append(Spacer(1, 12))

# ========== 15. STRENGTHS AND RISKS ==========
story.append(add_heading('<b>15. Strengths, Weaknesses, and Risk Assessment</b>', h1_style, 0))

story.append(add_heading('<b>15.1 Strengths</b>', h2_style, 1))
story.append(bullet('<b>Provider Agnosticism:</b> The OpenAI shim abstraction is well-designed, enabling support for 200+ models with minimal per-provider code. The translation layer handles complex edge cases like thinking blocks, content safety filters, and truncated JSON.'))
story.append(bullet('<b>Comprehensive Tool Set:</b> 35+ built-in tools covering file operations, shell execution, code search, web access, LSP integration, MCP bridging, notebook editing, and multi-agent orchestration provide a complete coding-agent toolkit.'))
story.append(bullet('<b>Sophisticated UI:</b> The custom Ink fork with Yoga layout, animated spinners, virtual scrolling, markdown rendering, and interactive components creates a polished terminal experience uncommon in CLI tools.'))
story.append(bullet('<b>Security Posture:</b> Multi-layered security including command classification, path validation, sandbox support, SSRF prevention, and permission modes demonstrates serious attention to safety in an autonomous agent context.'))
story.append(bullet('<b>Extensibility:</b> The plugin system, MCP integration, gRPC server mode, and VS Code extension provide multiple extension points for customization and integration.'))
story.append(bullet('<b>Build Quality:</b> Feature-flag-based dead code elimination, no-telemetry verification, and comprehensive quality assurance scripts (smoke, doctor, hardening, PR scanning) reflect mature engineering practices.'))

story.append(add_heading('<b>15.2 Weaknesses and Risks</b>', h2_style, 1))
story.append(bullet('<b>Legal Risk (Critical):</b> The project acknowledges it does not have Anthropic\'s authorization to distribute their proprietary source code. This represents an existential legal risk for the project and its users.'))
story.append(bullet('<b>Large Codebase Complexity:</b> With 39 top-level source directories, 35+ tools, and 80+ utility modules, the codebase has significant complexity that may present challenges for new contributors.'))
story.append(bullet('<b>Provider Fragmentation:</b> While supporting many providers is a strength, the README notes that "tool quality depends heavily on the selected model" and "smaller local models can struggle with long multi-step tool flows."'))
story.append(bullet('<b>Monolithic Entry Point:</b> main.tsx at ~730 lines handles too many concerns (CLI setup, system prompts, tools, auth, sessions, models, providers, migrations), making it difficult to maintain.'))
story.append(bullet('<b>DuckDuckGo Dependency:</b> Web search relies on DuckDuckGo scraping, which may be rate-limited, blocked, or subject to Terms of Service changes, reducing reliability.'))
story.append(bullet('<b>Settings Security:</b> Agent routing configuration in settings.json stores API keys in plaintext, which the project itself acknowledges by warning users to keep the file private.'))

# ========== BUILD ==========
doc.multiBuild(story)
print("PDF generated successfully at:", pdf_path)
