import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The app is served from https://<user>.github.io/mandate/, so every asset
// path has to be prefixed with the repository name.
export default defineConfig({
  base: '/mandate/',
  plugins: [react()],
})
