import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', 'coverage/**']
  },
  js.configs.recommended
];
