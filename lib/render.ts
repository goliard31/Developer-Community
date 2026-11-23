import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import hljs from 'highlight.js/lib/common';
import { classifyFile, extname } from './storage';

marked.setOptions({ gfm: true, breaks: false });

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span',
    'blockquote', 'pre', 'code', 'em', 'strong', 'del', 's', 'u', 'sub', 'sup',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'input',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'],
    pre: ['class'],
    span: ['class'],
    div: ['class'],
    input: ['type', 'checked', 'disabled'],
    th: ['align'],
    td: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

/** Markdown → 安全 HTML（GitHub 风格渲染，脚本与事件属性全部剥离） */
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md ?? '', { async: false }) as string;
  return sanitizeHtml(raw, SANITIZE_OPTIONS);
}

const HLJS_LANGUAGES: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.css': 'css',
  '.html': 'xml',
  '.htm': 'xml',
  '.xml': 'xml',
  '.svg': 'xml',
  '.sh': 'bash',
  '.sql': 'sql',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.md': 'markdown',
  '.txt': 'plaintext',
};

export function languageOf(path: string): string {
  return HLJS_LANGUAGES[extname(path)] ?? 'plaintext';
}

export interface HighlightedCode {
  html: string;
  language: string;
  languageLabel: string;
  highlighted: boolean;
}

/** 代码高亮；语言未知时退化为纯文本（仍然转义） */
export function highlightCode(source: string, filePath: string): HighlightedCode {
  const language = languageOf(filePath);
  const languageLabel = language === 'plaintext' ? '文本' : language;
  if (language === 'plaintext' || !hljs.getLanguage(language)) {
    return { html: escapeHtml(source), language, languageLabel, highlighted: false };
  }
  try {
    return {
      html: hljs.highlight(source, { language, ignoreIllegals: true }).value,
      language,
      languageLabel,
      highlighted: true,
    };
  } catch {
    return { html: escapeHtml(source), language, languageLabel, highlighted: false };
  }
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 是否可在网页中直接内联预览（不下载） */
export function isPreviewable(path: string): boolean {
  const kind = classifyFile(path);
  return kind === 'markdown' || kind === 'image' || kind === 'video' || kind === 'code' || kind === 'text';
}
