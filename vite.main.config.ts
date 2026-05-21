import { defineConfig } from 'vite';
import path from 'node:path';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    copyPublicDir: false,
  },
  plugins: [
    {
      name: 'copy-logo',
      closeBundle() {
        const outDir = path.resolve(__dirname, '.vite/build');
        copyFileSync(path.resolve(__dirname, 'logo.png'), path.join(outDir, 'logo.png'));
        copyFileSync(path.resolve(__dirname, 'logo.ico'), path.join(outDir, 'logo.ico'));
      },
    },
  ],
});
