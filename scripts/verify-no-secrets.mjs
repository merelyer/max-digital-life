import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const skippedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.exe', '.zip', '.woff', '.woff2']);
const serverOnlyVariables = ['TOKENDANCE_API_KEY', 'TOKENDANCE_MODEL_ID', 'SUPABASE_SERVICE_ROLE_KEY', 'API_CRON_SECRET'];
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const runtimeValues = serverOnlyVariables.map((name) => ({ name, value: process.env[name] ?? '' })).filter((item) => item.value.length > 0);
const violations = [];

for (const file of trackedFiles) {
  if (file === 'pnpm-lock.yaml' || skippedExtensions.has(extname(file).toLowerCase())) continue;
  const content = readFileSync(file);
  if (content.includes(0)) continue;
  const text = content.toString('utf8');
  if (/\bsk-[A-Za-z0-9_-]{16,}\b/u.test(text)) violations.push(`${file}: API-key pattern`);
  for (const runtime of runtimeValues) {
    if (text.includes(runtime.value)) violations.push(`${file}: runtime value for ${runtime.name}`);
  }
}

if (violations.length > 0) {
  console.error('FAIL: tracked files contain a secret-like value.');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('PASS: no secret-like values found in tracked files.');
}
