'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import EmailEditor from 'react-email-editor';
import type { EditorRef } from 'react-email-editor';

export interface EmailEditorProps {
  onReady: () => void;
  onExportHtml: (html: string) => void;
  initialDesign?: object;
  minHeight?: number | string;
}

export interface EmailEditorHandle {
  getHtml: () => Promise<string>;
  getJson: () => Promise<object | null>;
  loadDesign: (design: object) => void;
}

const DashboardEmailEditor = forwardRef<EmailEditorHandle, EmailEditorProps>(
  function DashboardEmailEditor(
    { onReady, onExportHtml, initialDesign, minHeight = 750 },
    ref
  ) {
    const editorRef = useRef<EditorRef | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (isReady && initialDesign && editorRef.current?.editor) {
        editorRef.current.editor.loadDesign(initialDesign as never);
      }
    }, [initialDesign, isReady]);

    useImperativeHandle(ref, () => ({
      getHtml: () =>
        new Promise<string>((resolve, reject) => {
          const instance = editorRef.current?.editor;
          if (!instance) {
            reject(new Error('Email editor is not ready'));
            return;
          }

          instance.exportHtml(({ html }) => {
            onExportHtml(html);
            resolve(html);
          });
        }),
      getJson: () =>
        new Promise<object | null>((resolve, reject) => {
          const instance = editorRef.current?.editor;
          if (!instance) {
            reject(new Error('Email editor is not ready'));
            return;
          }

          instance.saveDesign((design) => {
            resolve((design as object) ?? null);
          });
        }),
      loadDesign: (design: object) => {
        const instance = editorRef.current?.editor;
        if (!instance) {
          return;
        }
        instance.loadDesign(design as never);
      },
    }));

    return (
      <div className="relative w-full min-w-full min-h-[500px] rounded-md border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        {!isReady ? (
          <div className="absolute inset-0 z-10 rounded-md border border-input bg-muted/30 p-4 animate-pulse" />
        ) : null}
        <EmailEditor
          ref={editorRef}
          minHeight={minHeight}
          style={{ width: '100%', minWidth: '100%' }}
          options={{
            displayMode: 'email',
            appearance: {
              theme: 'light',
              panels: {
                tools: { dock: 'left' },
              },
            },
            features: {
              textEditor: {
                spellChecker: true,
                tables: true,
              },
            },
            fonts: {
              showDefaultFonts: true,
              customFonts: [
                {
                  label: 'Inter',
                  value: "'Inter', sans-serif",
                  url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
                },
                {
                  label: 'Libre Baskerville',
                  value: "'Libre Baskerville', serif",
                  url: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap',
                },
              ],
            },
          }}
          onReady={() => {
            setIsReady(true);
            onReady();
          }}
        />
      </div>
    );
  }
);

export default DashboardEmailEditor;
