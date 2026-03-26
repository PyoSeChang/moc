export type EditorType = 'markdown' | 'plain-text' | 'image' | 'pdf' | 'unsupported';

const EDITOR_MAP: Record<string, EditorType> = {
  md: 'markdown', mdx: 'markdown',
  txt: 'plain-text', json: 'plain-text', yaml: 'plain-text', yml: 'plain-text',
  csv: 'plain-text', xml: 'plain-text', html: 'plain-text', css: 'plain-text',
  js: 'plain-text', ts: 'plain-text', tsx: 'plain-text', jsx: 'plain-text',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image',
  pdf: 'pdf',
};

export function getEditorType(filePath: string): EditorType {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EDITOR_MAP[ext] ?? 'unsupported';
}
