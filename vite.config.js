import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inlineEdit from './vite-plugin-inline-edit.js';

export default defineConfig({
  /*
   * Asset URLs relative to the page, not absolute from the domain root.
   *
   * GitHub Pages serves a project site from a subpath - /vitejs-vite-kdvuf9qw/ - so a build that asks
   * for /assets/index.js gets a 404 there while working perfectly on a root domain. './' resolves
   * against wherever the page happens to sit, so one build works at a root, at a subpath, and from
   * `npx serve dist` locally. Safe here because there is no client-side routing: the tabs are state,
   * so no URL is ever deeper than the page itself.
   */
  base: './',
  // inlineEdit supplies the manifest of editable copy, and under `vite dev` an endpoint that writes
  // edits back to source. A production build gets the manifest only — there is no server to write with.
  plugins: [react(), inlineEdit()],
  /*
   * The worker bundle needs the same plugins. src/simWorker.js imports the engine from App.jsx, which
   * reaches EditMode.jsx and its virtual:editable-copy module - so without this the worker build fails
   * to resolve an import the main build resolves fine.
   */
  worker: { format: 'es', plugins: () => [react(), inlineEdit()] },
});
