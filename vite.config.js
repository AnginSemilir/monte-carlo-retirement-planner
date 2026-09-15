import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inlineEdit from './vite-plugin-inline-edit.js';

export default defineConfig({
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
