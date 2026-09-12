import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: every asset URL in the built index.html resolves next to the page
// itself, so the same dist/ works at a domain root, at /virtual-closet/, or at
// /is551/virtual-closet/ without a rebuild. Safe here because there is no client-side
// router — one index.html, no deep links for S3 to rewrite.
export default defineConfig({
  base: './',
  plugins: [react()],
})
