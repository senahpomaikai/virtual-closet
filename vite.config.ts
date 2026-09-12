import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute base matching the deploy path. A relative base ('./') looks more portable
// but breaks the moment the page is opened without a trailing slash: at
// /virtual-closet the browser resolves ./assets/x.js against the domain root and the
// page renders blank. An absolute base makes asset URLs independent of how the page
// URL happens to be spelled.
//
// There is no client-side router to keep in step with this — the three screens switch
// on in-app state, so there are no nested routes and no basename to configure.
export default defineConfig({
  base: '/virtual-closet/',
  plugins: [react()],
})
