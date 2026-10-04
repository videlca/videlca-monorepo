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
  // @videlca/shared is used with `import type` only, so Vite never bundles it
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
  build: {
    rollupOptions: {
      onwarn(_warning, _warn) {
        return;
      },
    },
    outDir: 'dist',
  },
});
