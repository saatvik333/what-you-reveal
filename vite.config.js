import { defineConfig } from 'vite';
const packageJson = require('./package.json');

export default defineConfig({
  // Root of the project (where index.html is now)
  root: '.',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  // Make paths relative for flexibility
  base: './',
  build: {
    // Output folder
    outDir: 'dist',
    // Clean output directory before building
    emptyOutDir: true,
  },
  server: {
    // Proxy API requests to Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
