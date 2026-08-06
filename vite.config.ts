import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const basePath = process.env.VITE_BASE_PATH || '/';

const config = defineConfig({
  base: basePath,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        crawlLinks: true,
        enabled: true,
        failOnError: true,
      },
    }),
    viteReact(),
  ],
});

export default config;
