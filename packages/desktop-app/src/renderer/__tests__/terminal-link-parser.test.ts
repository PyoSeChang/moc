import { describe, expect, it } from 'vitest';
import { extractFileLinks } from '../lib/terminal/terminal-link-parser';

describe('terminal-link-parser', () => {
  it('extracts quoted paths with spaces as one file link', () => {
    const [link] = extractFileLinks('open "C:\\My Project\\src\\main.ts:12:3"');

    expect(link).toMatchObject({
      path: 'C:\\My Project\\src\\main.ts',
      line: 12,
      col: 3,
    });
  });

  it('ignores labels before quoted paths', () => {
    const [link] = extractFileLinks("'ESCAPED: packages/desktop-app/src/my editor/file name.ts'");

    expect(link).toMatchObject({
      path: 'packages/desktop-app/src/my editor/file name.ts',
    });
  });

  it('extracts escaped spaces', () => {
    const [link] = extractFileLinks('src/My\\ Project/file.ts');

    expect(link).toMatchObject({
      path: 'src/My Project/file.ts',
    });
  });

  it('does not guess unquoted paths with spaces', () => {
    const links = extractFileLinks('REL: packages/desktop-app/src/my editor/file name.ts');

    expect(links).toEqual([]);
  });

  it('does not extract file-like substrings from URLs', () => {
    const links = extractFileLinks('URL: https://example.com/packages/app/file.ts');

    expect(links).toEqual([]);
  });
});
