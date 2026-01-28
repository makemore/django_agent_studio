import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '../static/django_agent_studio/js',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'AgentStudio',
      fileName: () => 'builder.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Ensure CSS is inlined or separate
        assetFileNames: '[name][extname]',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    // Avoid Vue devtools in production
    __VUE_PROD_DEVTOOLS__: false,
    // Define process.env for libraries that expect it
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

