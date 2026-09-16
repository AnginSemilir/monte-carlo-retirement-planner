/*
 * A `window` for the worker, in dev only.
 *
 * Vite injects its HMR client into worker modules the same way it does page modules, and
 * @vitejs/plugin-react adds a React Refresh preamble on top. Both reach for `window`, which a worker
 * does not have, so the worker dies on import before any of our code runs. A production build contains
 * neither, and the worker is fine there - this exists purely so dev behaves like the build.
 *
 * It is imported as the FIRST import of simWorker.js rather than written inline: ES imports are hoisted
 * and evaluated in order, so a bare assignment at the top of that file would still run after App.jsx had
 * been evaluated and already thrown.
 */
if (typeof window === 'undefined') globalThis.window = globalThis;
if (typeof document === 'undefined') {
  /*
   * A document that answers anything without doing anything. Enumerating the properties the injected
   * clients happen to touch is whack-a-mole - the first attempt shimmed createElement and querySelector
   * and then died on querySelectorAll - so this returns a no-op callable for every lookup instead. It is
   * never used to render: nothing in the worker draws, it only has to survive being probed.
   */
  const noop = () => undefined;
  const stub = new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive || k === 'toString' ? () => '' : stub),
    apply: () => stub,
    set: () => true
  });
  globalThis.document = stub;
  globalThis.addEventListener = globalThis.addEventListener || noop;
  globalThis.removeEventListener = globalThis.removeEventListener || noop;
}
