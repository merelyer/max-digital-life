import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gitignore = await readFile('.gitignore', 'utf8');
const envExample = await readFile('.env.example', 'utf8');

assert.match(gitignore, /^\.env$/m);
assert.match(gitignore, /^\.env\.local$/m);
assert.match(envExample, /^TOKENDANCE_API_KEY=$/m);
assert.doesNotMatch(envExample, /sk-[A-Za-z0-9_-]{12,}/);
