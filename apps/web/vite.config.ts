import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const modelRevision = createHash('sha256')
  .update(readFileSync(new URL('./public/models/money-tour.glb', import.meta.url)))
  .digest('hex')
  .slice(0, 12);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { 'import.meta.env.VITE_MODEL_REVISION': JSON.stringify(modelRevision) },
  build: { chunkSizeWarningLimit: 700 },
});
