import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PREVIEW=1 builds a self-contained copy (fonts inlined, relative paths)
// for hosting as a single shareable page.
const preview = process.env.PREVIEW === '1';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: preview ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false } : {},
});
