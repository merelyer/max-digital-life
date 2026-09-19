import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function collectTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

describe('compiled API runtime', () => {
  it('uses explicit JavaScript extensions for native Node ESM imports', () => {
    const apiSource = fileURLToPath(new URL('.', import.meta.url));
    const domainSource = resolve(apiSource, '../../../packages/domain/src');
    const extensionlessImports = [...collectTypeScriptFiles(apiSource), ...collectTypeScriptFiles(domainSource)].flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return [...source.matchAll(/\bfrom\s+['"]((?:\.\.?\/)[^'"]+)['"]/g)]
        .map((match) => ({ path, specifier: match[1] }))
        .filter(({ specifier }) => specifier && !specifier.endsWith('.js'));
    });

    expect(extensionlessImports).toEqual([]);
  });
});
