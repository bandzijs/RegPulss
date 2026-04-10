'use client';

interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

export default function GrapesEditor({ height = '700px' }: GrapesEditorProps) {
  return (
    <div
      style={{
        width: '100%',
        height,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#6b7280',
      }}
    >
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Email Editor</p>
        <p style={{ fontSize: 13 }}>Use the Upload Design or Apply Preset buttons above.</p>
      </div>
    </div>
  );
}
