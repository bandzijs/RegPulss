'use client';

import 'grapesjs/dist/css/grapes.min.css';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import presetNewsletter from 'grapesjs-preset-newsletter';

export interface GrapesEditorProps {
  initialHtml?: string;
  initialCss?: string;
  onReady?: () => void;
  onChange?: (html: string) => void;
  height?: string;
}

export interface GrapesEditorHandle {
  getHtml: () => Promise<string>;
  setHtml: (html: string) => void;
}

const GrapesEditor = forwardRef<GrapesEditorHandle, GrapesEditorProps>(
  function GrapesEditor(
    { initialHtml = '', initialCss = '', onReady, onChange, height = '700px' },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<Editor | null>(null);

    useEffect(() => {
      if (!containerRef.current || editorRef.current) {
        return;
      }

      const editor = grapesjs.init({
        container: containerRef.current,
        plugins: [presetNewsletter],
        pluginsOpts: {
          [presetNewsletter as unknown as string]: {
            modalLabelImport: 'Paste your HTML here',
            modalLabelExport: 'Copy this code',
            codeViewerTheme: 'material',
            importPlaceholder: '<table>...</table>',
            inlineCss: true,
            cellStyle: {
              'font-size': '14px',
              'font-weight': 300,
              'vertical-align': 'top',
              color: 'rgb(111, 119, 125)',
              margin: 0,
              padding: 0,
            },
          },
        },
        storageManager: false,
        height,
        width: '100%',
      });

      editorRef.current = editor;

      if (initialHtml) {
        editor.setComponents(initialHtml);
      }
      if (initialCss) {
        editor.setStyle(initialCss);
      }

      editor.on('update', () => {
        if (!onChange) {
          return;
        }
        const html = `${editor.getHtml()}<style>${editor.getCss()}</style>`;
        onChange(html);
      });

      onReady?.();

      return () => {
        editor.destroy();
        editorRef.current = null;
      };
    }, [height, initialCss, initialHtml, onChange, onReady]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }
      editor.setComponents(initialHtml || '');
      if (initialCss) {
        editor.setStyle(initialCss);
      }
    }, [initialHtml, initialCss]);

    useImperativeHandle(ref, () => ({
      async getHtml() {
        const editor = editorRef.current;
        if (!editor) {
          throw new Error('GrapesJS editor is not ready');
        }
        return `${editor.getHtml()}<style>${editor.getCss()}</style>`;
      },
      setHtml(html: string) {
        const editor = editorRef.current;
        if (!editor) {
          return;
        }
        editor.setComponents(html || '');
      },
    }));

    return <div ref={containerRef} className="w-full min-h-[500px]" />;
  }
);

export default GrapesEditor;
