'use client';

import { useRef } from 'react';
import EmailEditor, { EditorRef } from 'react-email-editor';

interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

export default function GrapesEditor({ onChange, height = '700px' }: GrapesEditorProps) {
  const emailEditorRef = useRef<EditorRef>(null);

  const onReady = () => {
    const editor = emailEditorRef.current?.editor;
    if (!editor) return;
    editor.addEventListener('design:updated', () => {
      editor.exportHtml((data) => {
        onChange?.(data.html);
      });
    });
  };

  return (
    <div style={{ width: '100%', height }}>
      <EmailEditor
        ref={emailEditorRef}
        onReady={onReady}
        style={{ height }}
        options={{
          appearance: { theme: 'light' },
        }}
      />
    </div>
  );
}