'use client';

import { useRef } from 'react';
import Editor from '@grapesjs/react';
import grapesjs from 'grapesjs';
import presetNewsletter from 'grapesjs-preset-newsletter';
import 'grapesjs/dist/css/grapes.min.css';

interface GrapesEditorProps {
  initialHtml?: string;
  onChange?: (html: string) => void;
  height?: string;
}

export default function GrapesEditor({
  initialHtml,
  onChange,
  height = '700px',
}: GrapesEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  return (
    <Editor
      grapesjs={grapesjs}
      options={{
        storageManager: false,
        height,
        width: '100%',
        components: initialHtml || '',
        pluginsOpts: {
          'grapesjs-preset-newsletter': {
            inlineCss: true,
          },
        },
      }}
      plugins={[presetNewsletter]}
      onUpdate={(_project, editor) => {
        const html = `${editor.getHtml()}<style>${editor.getCss() ?? ''}</style>`;
        onChangeRef.current?.(html);
      }}
    />
  );
}
