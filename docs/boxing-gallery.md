# Boxing gallery

The standalone gallery is served at `/boxing_gallery/`. The Vite development and preview middleware redirect `/boxing_gallery` to the directory URL so relative assets resolve correctly. The production build copies the directory as-is for static hosting (including GitHub Pages).

Imported from **Build Boxing Website**, deployed at https://guard-up-boxing.recklezz.chatgpt.site, source commit `1a18f7878b4a67c2cdcf13a43508c1c8dbf64d64`. All 64 imported files are byte-for-byte matches against `boxing-gallery-original.sha256`. Unused legacy media and hosting metadata were omitted. Google Fonts remains the same external dependency as the original.

The original HTML, CSS, JavaScript, photos, six fight videos, glove art, soundtrack and sound effects are preserved. The homepage does not import the gallery. No merge or deployment was performed.

Validation: `node --test tests/boxing-gallery/*.test.mjs` (23 passing), `npm run lint`, and `npm run build`. Original tests only change import paths to the new directory. Browser checks covered the desktop opening and matching scrolled photo composition against the original, mobile rendering at 390×844, the slashless redirect, and a clean browser error log. Animated shader, video and punch timing naturally differ between separate captures.
