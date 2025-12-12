'use client';

import Editor from '@monaco-editor/react';
import { debounce } from 'lodash';
import { useCallback, useState } from 'react';

const defaultCode = `// Welcome to the Monaco Editor example
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState('');

  const handleEditorChange = useCallback(
    debounce((value: string | undefined) => {
      if (value) {
        setCode(value);
        // Simple "evaluation" - just show the code length
        setOutput(`Code length: ${value.length} characters`);
      }
    }, 300),
    []
  );

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Monaco Editor with Next.js 15</h1>
      <p>This example uses Monaco Editor, Sentry, and lodash</p>

      <div style={{ border: '1px solid #ccc', marginTop: '1rem' }}>
        <Editor
          height="400px"
          defaultLanguage="typescript"
          defaultValue={defaultCode}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5' }}>
        <strong>Output:</strong> {output}
      </div>
    </main>
  );
}
