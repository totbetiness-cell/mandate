import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The app is served from https://<user>.github.io/mandate/, so every asset
// path has to be prefixed with the repository name.
export default defineConfig({
  base: '/mandate/',
  plugins: [react()],
  test: {
    // The live devnet check is opt-in (DEVNET_LIVE=1) but still lives in src,
    // so it is listed here explicitly rather than excluded by a naming trick.
    include: ['src/**/*.test.ts'],
  },
})
