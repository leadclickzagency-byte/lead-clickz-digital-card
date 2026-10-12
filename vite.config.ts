import path from 'node:path';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { leadClickzProfiles } from './src/data/profiles';

/** Writes /<slug>/index.html with that person's title, description and preview image, so a
 * shared card link unfurls as their card (the SPA itself is identical). */
function profilePages(): Plugin {
  return {
    name: 'lead-clickz-profile-pages',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist');
      const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
      for (const p of Object.values(leadClickzProfiles)) {
        const title = `${p.name} · ${p.role}, Lead Clickz™`;
        const description = `This isn’t a business card. It’s a signal. Save ${p.firstName}’s contact, spin the 3D card and see it in AR.`;
        const page = html
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${description}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${description}`)
          .replace(/(<meta property="og:image" content=")[^"]*/, `$1/og/${p.slug}.jpg`);
        mkdirSync(path.join(dist, p.slug), { recursive: true });
        writeFileSync(path.join(dist, p.slug, 'index.html'), page);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), profilePages()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});
