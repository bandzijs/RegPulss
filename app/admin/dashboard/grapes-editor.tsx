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
  setComponents: (html: string) => void;
  destroy: () => void;
}

type GrapesInit = (config: Record<string, unknown>) => GrapesEditorInstance;

export default function GrapesEditor({
  initialHtml,
  onChange,
  height = '700px',
}: GrapesEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<GrapesEditorInstance | null>(null);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/exhaustive-deps -- single CDN init; initialHtml synced in second effect */
  useEffect(() => {
    let mounted = true;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };

    const loadLink = (href: string): void => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const init = async () => {
      try {
        loadLink('https://unpkg.com/grapesjs/dist/css/grapes.min.css');
        await loadScript('https://unpkg.com/grapesjs');
        await loadScript('https://unpkg.com/grapesjs-preset-newsletter');

        if (!mounted || !containerRef.current) return;

        const w = window as typeof window & { grapesjs?: GrapesInit | { default: GrapesInit } };
        const raw = w.grapesjs;
        const gjs: GrapesInit | undefined =
          typeof raw === 'function'
            ? raw
            : raw && typeof raw === 'object' && 'default' in raw && typeof raw.default === 'function'
              ? raw.default
              : undefined;

        if (!gjs) return;

        const editor = gjs({
          container: containerRef.current,
          plugins: ['grapesjs-preset-newsletter'],
          pluginsOpts: { 'grapesjs-preset-newsletter': {} },
          storageManager: false,
          height,
          width: '100%',
          components: initialHtml || '',
        });

        editorRef.current = editor;
        editor.on('update', () => onChange?.(editor.getHtml()));
        setLoading(false);
      } catch (err) {
        console.error('GrapesJS load error:', err);
        setLoading(false);
      }
    };

    void init();
    return () => {
      mounted = false;
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (editorRef.current && initialHtml !== undefined) {
      editorRef.current.setComponents(initialHtml || '');
    }
  }, [initialHtml]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {loading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            zIndex: 10,
          }}
        >
          Loading editor...
        </div>
      ) : null}
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}
