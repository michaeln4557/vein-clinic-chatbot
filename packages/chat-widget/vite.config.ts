import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    // NOTE: Mock API plugin was REMOVED. All API calls now go to the real backend.
    // The mock was intercepting requests and returning hardcoded responses that
    // bypassed the workflow state machine, qualification gate, and Claude API.
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'VeinClinicChat',
      formats: ['iife', 'es'],
      fileName: (format) => `vein-clinic-chat.${format}.js`,
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
    cssCodeSplit: false,
    minify: 'terser',
    target: 'es2015',
  },
  server: {
    port: 3200,
  },
});
