import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // scene-editor.html is a dev-only tool (see src/scene-editor/) and must
    // not end up in dist/ or the GitHub Pages deploy.
    rollupOptions: {
      input: 'index.html',
    },
  },
})
