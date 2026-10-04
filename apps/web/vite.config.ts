import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react()
  ],
  server: {
    // In development the SPA runs on Vite (5173) and forwards API calls to NestJS
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Needed because @videlca/shared is a linked CommonJS workspace package
  optimizeDeps: { include: ['@videlca/shared'] },
  build: {
    commonjsOptions: { include: [/shared/, /node_modules/] },
    rollupOptions: {
      onwarn(_warning, _warn) {
        return;
      },
    },
    outDir: 'dist',
  },
});
