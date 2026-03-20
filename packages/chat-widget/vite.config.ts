import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
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
      // Bundle React into the IIFE output so it's self-contained
      output: {
        globals: {},
      },
    },
    cssCodeSplit: false,
    minify: 'terser',
    target: 'es2015',
  },
  server: {
    port: 3100,
  },
});
