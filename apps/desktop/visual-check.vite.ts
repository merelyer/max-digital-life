import react from '@vitejs/plugin-react';
export default {
  root: 'src/renderer',
  publicDir: '../../public',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5177, strictPort: true }
};
