'use client';

import { useEffect, useRef, useState } from 'react';

interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

interface GrapesEditorInstance {
  on: (event: string, callback: () => void) => void;
  getHtml: () => string;
  getCss: () => string | undefined;
  setComponents: (html: string) => void;
  destroy: () => void;
}

type GrapesInit = (config: Record<string, unknown>) => GrapesEditorInstance;

function getGrapesFromWindow(): GrapesInit | undefined {
  const w = window as typeof window & {
    grapesjs?: GrapesInit | { default: GrapesInit };
  };
  const raw = w.grapesjs;
  if (typeof raw === 'function') {
    return raw;
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'default' in raw &&
    typeof raw.default === 'function'
  ) {
    return raw.default;
  }
  return undefined;
}

function getPresetPlugin(): unknown {
  const w = window as unknown as Record<string, unknown>;
  const preset = w['grapesjs-preset-newsletter'];
  if (typeof preset === 'function') {
    return preset;
  }
  if (
    preset &&
    typeof preset === 'object' &&
    'default' in preset &&
    typeof (preset as { default: unknown }).default === 'function'
  ) {
    return (preset as { default: unknown }).default;
  }
  return undefined;
}

const GJS_CSS =
  'https://unpkg.com/grapesjs@0.22.14/dist/css/grapes.min.css';
const GJS_JS = 'https://unpkg.com/grapesjs@0.22.14/dist/grapes.min.js';
const PRESET_JS =
  'https://unpkg.com/grapesjs-preset-newsletter@1.0.2/dist/index.js';

export default function GrapesEditor({
  initialHtml,
  onChange,
  height = '700px',
}: GrapesEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<GrapesEditorInstance | null>(null);
  const initialHtmlRef = useRef(initialHtml);
  initialHtmlRef.current = initialHtml;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );

  function initEditor() {
    const container = containerRef.current;
    if (!container || editorRef.current) {
      return;
    }

    const gjs = getGrapesFromWindow();
    if (!gjs) {
      setStatus('error');
      return;
    }

    const presetPlugin = getPresetPlugin();
    const plugins = presetPlugin
      ? [presetPlugin]
      : (['grapesjs-preset-newsletter'] as const);

    try {
      const editor = gjs({
        container,
        plugins: [...plugins],
        pluginsOpts: { 'grapesjs-preset-newsletter': {} },
        storageManager: false,
        height,
        width: '100%',
        components: initialHtmlRef.current || '',
      });
      editorRef.current = editor;
      editor.on('update', () => {
        const html = `${editor.getHtml()}<style>${editor.getCss() ?? ''}</style>`;
        onChangeRef.current?.(html);
      });
      setStatus('ready');
    } catch (e) {
      console.error('GrapesJS init failed:', e);
      setStatus('error');
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps -- one-time CDN script load */
  useEffect(() => {
    if (!document.querySelector('link[data-gjs-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-gjs-css', '1');
      link.href = GJS_CSS;
      document.head.appendChild(link);
    }

    const loadScript = (src: string, id: string): Promise<void> =>
      new Promise((resolve) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
      });

    const run = async () => {
      await loadScript(GJS_JS, 'grapesjs-script');
      await loadScript(PRESET_JS, 'grapesjs-newsletter-script');
      setTimeout(() => {
        initEditor();
      }, 500);
    };

    void run();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (editorRef.current && initialHtml !== undefined) {
      editorRef.current.setComponents(initialHtml || '');
    }
  }, [initialHtml]);

  return (
    <div style={{ width: '100%', position: 'relative', height }}>
      {status === 'loading' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9f9f9',
            gap: 12,
          }}
        >
          <div>Loading editor...</div>
          <button
            type="button"
            onClick={() => initEditor()}
            style={{
              padding: '8px 16px',
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Click if editor doesn&apos;t load
          </button>
        </div>
      ) : null}
      {status === 'error' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff3f3',
          }}
        >
          <div>
            Editor failed to load.
            <button
              type="button"
              onClick={() => {
                setStatus('loading');
                setTimeout(() => initEditor(), 100);
              }}
              style={{ marginLeft: 8, padding: '4px 8px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: height,
        }}
      />
    </div>
  );
}
