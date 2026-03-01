import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://stackmatrices.com',
  base: '/geo',
  output: 'static',
  build: {
    format: 'directory'
  },
  outDir: './dist/geo'
});
