const requiredNames = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_BASE_URL'
];

const missingNames = requiredNames.filter((name) => !process.env[name]?.trim());

if (missingNames.length > 0) {
  console.error(`FAIL: missing desktop build configuration: ${missingNames.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('PASS: desktop public build configuration is present.');
}
