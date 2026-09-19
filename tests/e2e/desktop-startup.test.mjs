import { strict as assert } from 'node:assert';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const mainBundle = resolve(root, 'apps/desktop/out/main/index.js');

test('packaged desktop main bundle does not include the Electron downloader', async (context) => {
  try {
    await access(mainBundle);
  } catch {
    context.skip('desktop build output is not present; run the desktop build first');
    return;
  }

  const source = await readFile(mainBundle, 'utf8');
  assert.doesNotMatch(source, /Downloading Electron binary/);
  assert.doesNotMatch(source, /install\\.js/);
});
