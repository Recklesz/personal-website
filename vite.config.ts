import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin, type Connect} from 'vite';

// Keep the standalone gallery's relative assets scoped to its own directory.
const boxingGalleryRoute: Connect.NextHandleFunction = (req, res, next) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/boxing_gallery') {
    res.writeHead(308, {Location: `/boxing_gallery/${url.search}`});
    res.end();
    return;
  }
  if (url.pathname === '/boxing_gallery/') {
    req.url = `/boxing_gallery/index.html${url.search}`;
  }
  next();
};

const boxingGallery: Plugin = {
  name: 'boxing-gallery-route',
  configureServer(server) { server.middlewares.use(boxingGalleryRoute); },
  configurePreviewServer(server) { server.middlewares.use(boxingGalleryRoute); },
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [boxingGallery, react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
