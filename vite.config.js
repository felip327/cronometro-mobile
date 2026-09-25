import { defineConfig } from 'vite'

export default defineConfig({
  root: 'www',
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})