// src/common/sanitize/sanitize.util.ts
let _sanitizeFn: ((dirty: string, opts: any) => string) | null = null;

async function loadSanitizeFn() {
  if (_sanitizeFn) return _sanitizeFn;

  // Import dinámico (ESM). En CJS devuelve namespace con .default
  const mod: any = await import('sanitize-html');

  const candidate =
    typeof mod === 'function'
      ? mod
      : typeof mod?.default === 'function'
        ? mod.default
        : // algunos toolchains exponen también mod.sanitize / mod.sanitizeHtml
          typeof mod?.sanitize === 'function'
          ? mod.sanitize
          : typeof mod?.sanitizeHtml === 'function'
            ? mod.sanitizeHtml
            : null;

  if (!candidate) {
    // imprime qué llegó para depurar rápido
    const keys = Object.keys(mod || {});
    throw new Error(
      `sanitize-html import no expone una función (recibido: { ${keys.join(', ')} })`,
    );
  }

  _sanitizeFn = candidate;
  return _sanitizeFn;
}

const ALLOWED_IMG_HOSTS = new Set([
  'localhost',
  // añade tus hosts de media
  'cdn.tu-dominio.com',
  'static.tu-dominio.com',
]);

const OPTIONS = {
  allowedTags: [
    'p',
    'br',
    'span',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'img',
    'iframe',
    'video',
    'source',
    'hr',
    'div',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    iframe: [
      'src',
      'width',
      'height',
      'allow',
      'allowfullscreen',
      'frameborder',
    ],
    video: ['src', 'controls', 'width', 'height', 'poster'],
    source: ['src', 'type'],
    span: ['class', 'style'],
    p: ['class', 'style'],
    h1: ['class', 'style'],
    h2: ['class', 'style'],
    h3: ['class', 'style'],
    h4: ['class', 'style'],
    div: ['class', 'style'],
    code: ['class'],
    pre: ['class'],
  },
  allowedClasses: {
    p: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
      'ql-indent-1',
      'ql-indent-2',
      'ql-indent-3',
      'ql-indent-4',
    ],
    h1: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    h2: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    h3: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    h4: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    h5: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    h6: [
      'ql-align-left',
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
    ],
    span: [
      'ql-size-small',
      'ql-size-large',
      'ql-size-huge',
      'ql-font-monospace',
      'ql-font-serif',
      'ql-font-sans-serif',
      'ql-code-block',
    ],
    div: ['ql-code-block-container'],
    code: ['ql-code-block'],
    pre: ['ql-code-block'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      color: [/.*/],
      'background-color': [/.*/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
  transformTags: {
    a: (_: string, a: any) => {
      const href = a.href || '';
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
        return { tagName: 'span', text: a.href || '' };
      }
      return {
        tagName: 'a',
        attribs: {
          href,
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      };
    },
    img: (_: string, a: any) => {
      const src = a.src || '';
      try {
        const u = new URL(src);
        if (!ALLOWED_IMG_HOSTS.has(u.hostname)) {
          return { tagName: 'span', text: '[imagen bloqueada]' };
        }
      } catch {
        return { tagName: 'span', text: '[imagen inválida]' };
      }
      return { tagName: 'img', attribs: { src, alt: a.alt || '' } };
    },
  },
  exclusiveFilter(frame: any) {
    if (frame.tag === 'span' && (frame.attribs?.class || '').includes('ql-ui'))
      return true;
    if (frame.tag === 'p' || frame.tag === 'span') {
      const text = (frame.text || '').trim();
      return !text && !frame.tag;
    }
    return false;
  },
};

export async function sanitizeQuill(html: string): Promise<string> {
  const sanitize = await loadSanitizeFn();
  const dirty = typeof html === 'string' ? html : '';
  return sanitize(dirty, OPTIONS);
}
