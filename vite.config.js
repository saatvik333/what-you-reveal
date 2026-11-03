import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'

// package.json is the only place the version is written; index.html reads it as %APP_VERSION%.
const appVersion = {
  name: 'app-version',
  transformIndexHtml: (html) => html.replaceAll('%APP_VERSION%', version),
}

export default defineConfig({
  plugins: [vue(), appVersion],
  build: {
    // Small font subsets would otherwise be base64-inlined into the render-blocking CSS,
    // downloaded by everyone whether or not the page uses those scripts.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
})
