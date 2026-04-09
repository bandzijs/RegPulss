'use client';

import { useEffect, useRef } from 'react';

const GJS_CSS = 'https://unpkg.com/grapesjs/dist/css/grapes.min.css';
const GJS_JS = 'https://unpkg.com/grapesjs';
const GJS_PRESET = 'https://unpkg.com/grapesjs-preset-newsletter';

export interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

type GrapesInit = (config: Record<string, unknown>) => {
  on: (event: string, cb: () => void) => void;
  getHtml: () => string;
  getCss: () => string | undefined;
  setComponents: (html: string) => void;
  destroy: () => void;
};

function ensureCssLink() {
  if (document.querySelector('link[data-regpulss-grapes-css]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GJS_CSS;
  link.dataset.regpulssGrapesCss = 'true';
  document.head.appendChild(link);
}

function loadScript(src: string, slot: 'grapesjs' | 'preset'): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-regpulss-grapes="${slot}"]`
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.regpulssGrapes = slot;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function getGrapesInit(): GrapesInit {
  const w = window as Window & {
    grapesjs?: unknown;
  };
  const g = w.grapesjs;
  if (typeof g === 'function') {
    return g as GrapesInit;
  }
  if (g && typeof g === 'object' && 'default' in g && typeof (g as { default: unknown }).default === 'function') {
    return (g as { default: GrapesInit }).default;
  }
  throw new Error('grapesjs is not available on window');
}

function getNewsletterPreset(): unknown {
  const w = window as unknown as Record<string, unknown>;
  const preset = w['grapesjs-preset-newsletter'];
  if (typeof preset === 'function') {
    return preset;
  }
  if (preset && typeof preset === 'object' && 'default' in preset) {
    return (preset as { default: unknown }).default;
  }
  throw new Error('grapesjs-preset-newsletter is not available on window');
}

export default function GrapesEditor({
  initialHtml,
  onChange,
  height = '700px',
}: GrapesEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReturnType<GrapesInit> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const htmlAtMount = initialHtml ?? '';
    let cancelled = false;

    (async () => {
      try {
        ensureCssLink();
        await loadScript(GJS_JS, 'grapesjs');
        await loadScript(GJS_PRESET, 'preset');

        if (cancelled || !containerRef.current || editorRef.current) {
          return;
        }

        const gjs = getGrapesInit();
        const presetNewsletter = getNewsletterPreset();

        const editor = gjs({
          container: containerRef.current,
          plugins: [presetNewsletter],
          pluginsOpts: {
            'grapesjs-preset-newsletter': {
              inlineCss: true,
            },
          },
          storageManager: false,
          height,
          width: '100%',
          components: htmlAtMount,
        });

        editorRef.current = editor;

        editor.on('update', () => {
          const html = `${editor.getHtml()}<style>${editor.getCss() ?? ''}</style>`;
          onChangeRef.current?.(html);
        });
      } catch (e) {
        console.error('GrapesJS (CDN) init failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // initialHtml is intentionally omitted from deps: parent remounts via key when loading drafts/presets/uploads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
}
