'use client';

interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

export default function GrapesEditor({ height = '700px' }: GrapesEditorProps) {
  return (
    <div style={{ width: '100%', height, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <iframe
        src="https://usewaypoint.github.io/email-builder-js/"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Email Builder"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}