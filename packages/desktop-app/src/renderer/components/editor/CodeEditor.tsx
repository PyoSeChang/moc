import React, { useCallback, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';
import { getCssColorAsHex } from './editor-utils';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function CodeEditor({ content, language, onChange, onSave }: CodeEditorProps): JSX.Element {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Ctrl+S / Cmd+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  }, [onSave]);

  const handleChange = useCallback((value: string | undefined) => {
    onChange(value ?? '');
  }, [onChange]);

  const isDark = document.documentElement.getAttribute('data-mode') !== 'light';
  const bg = getCssColorAsHex('--surface-panel', isDark ? '#1e1e1e' : '#ffffff');

  const handleBeforeMount = useCallback((monaco: Parameters<NonNullable<Parameters<typeof Editor>[0]['beforeMount']>>[0]) => {
    monaco.editor.defineTheme('moc-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': bg },
    });
    monaco.editor.defineTheme('moc-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: { 'editor.background': bg },
    });
  }, [bg]);

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      theme={isDark ? 'moc-dark' : 'moc-light'}
      beforeMount={handleBeforeMount}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}
