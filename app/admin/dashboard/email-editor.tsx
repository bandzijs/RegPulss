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
}

export interface EmailEditorHandle {
  getHtml: () => Promise<string>;
  getJson: () => Promise<object | null>;
}

const DashboardEmailEditor = forwardRef<EmailEditorHandle, EmailEditorProps>(
  function DashboardEmailEditor({ onReady, onExportHtml, initialDesign }, ref) {
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
    }));

    return (
      <div className="relative w-full min-h-[600px]">
        {!isReady ? (
          <div className="absolute inset-0 z-10 rounded-md border border-input bg-muted/30 p-4 animate-pulse" />
        ) : null}
        <EmailEditor
          ref={editorRef}
          minHeight={600}
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
