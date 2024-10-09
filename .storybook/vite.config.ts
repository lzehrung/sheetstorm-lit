import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, '../src/components'),
      // Add other aliases if necessary
    },
  },
});
