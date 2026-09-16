/*
 * TAILWIND, BUILT RATHER THAN FETCHED.
 *
 * This is the config that used to sit inline in index.html beside `<script src="cdn.tailwindcss.com">`.
 * The CDN build is explicitly not for production - it ships the whole compiler to every visitor, scans
 * the DOM at runtime, and puts a render-blocking third-party request in front of the first paint. The
 * same config compiled at build time produces one small stylesheet carrying only the classes this app
 * actually uses.
 *
 * The colours are all `rgb(var(--token)/<alpha-value>)`, so the palette still lives in the CSS custom
 * properties in index.html and the three themes keep working by swapping those variables. Nothing about
 * theming changes here; only where the stylesheet comes from.
 *
 * One consequence worth knowing: the build scans these files as TEXT, so a class name has to appear
 * spelled out in the source. An interpolated `text-${tone}-600` compiled to nothing under the CDN too,
 * and the places that could have reached for one already avoid it - see SUM_TONES in App.jsx.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  darkMode: 'class',
  theme: { extend: {
    colors: {
      slate:   { 50:'rgb(var(--slate-50)/<alpha-value>)', 100:'rgb(var(--slate-100)/<alpha-value>)', 200:'rgb(var(--slate-200)/<alpha-value>)', 300:'rgb(var(--slate-300)/<alpha-value>)', 400:'rgb(var(--slate-400)/<alpha-value>)', 500:'rgb(var(--slate-500)/<alpha-value>)', 600:'rgb(var(--slate-600)/<alpha-value>)', 700:'rgb(var(--slate-700)/<alpha-value>)', 800:'rgb(var(--slate-800)/<alpha-value>)', 900:'rgb(var(--slate-900)/<alpha-value>)' },
      surface: { DEFAULT: 'rgb(var(--surface)/<alpha-value>)' },
      blue:    { 50:'rgb(var(--blue-50)/<alpha-value>)', 100:'rgb(var(--blue-100)/<alpha-value>)', 200:'rgb(var(--blue-200)/<alpha-value>)', 500:'rgb(var(--blue-500)/<alpha-value>)', 600:'rgb(var(--blue-600)/<alpha-value>)', 700:'rgb(var(--blue-700)/<alpha-value>)', 800:'rgb(var(--blue-800)/<alpha-value>)', 950:'rgb(var(--blue-950)/<alpha-value>)' },
      indigo:  { 50:'rgb(var(--indigo-50)/<alpha-value>)', 100:'rgb(var(--indigo-100)/<alpha-value>)', 200:'rgb(var(--indigo-200)/<alpha-value>)', 500:'rgb(var(--indigo-500)/<alpha-value>)', 600:'rgb(var(--indigo-600)/<alpha-value>)', 700:'rgb(var(--indigo-700)/<alpha-value>)', 800:'rgb(var(--indigo-800)/<alpha-value>)', 900:'rgb(var(--indigo-900)/<alpha-value>)', 950:'rgb(var(--indigo-950)/<alpha-value>)' },
      emerald: { 50:'rgb(var(--emerald-50)/<alpha-value>)', 100:'rgb(var(--emerald-100)/<alpha-value>)', 200:'rgb(var(--emerald-200)/<alpha-value>)', 300:'rgb(var(--emerald-300)/<alpha-value>)', 600:'rgb(var(--emerald-600)/<alpha-value>)', 700:'rgb(var(--emerald-700)/<alpha-value>)', 800:'rgb(var(--emerald-800)/<alpha-value>)' },
      rose:    { 50:'rgb(var(--rose-50)/<alpha-value>)', 100:'rgb(var(--rose-100)/<alpha-value>)', 200:'rgb(var(--rose-200)/<alpha-value>)', 300:'rgb(var(--rose-300)/<alpha-value>)', 400:'rgb(var(--rose-400)/<alpha-value>)', 600:'rgb(var(--rose-600)/<alpha-value>)', 700:'rgb(var(--rose-700)/<alpha-value>)', 800:'rgb(var(--rose-800)/<alpha-value>)', 950:'rgb(var(--rose-950)/<alpha-value>)' },
      amber:   { 50:'rgb(var(--amber-50)/<alpha-value>)', 100:'rgb(var(--amber-100)/<alpha-value>)', 200:'rgb(var(--amber-200)/<alpha-value>)', 300:'rgb(var(--amber-300)/<alpha-value>)', 500:'rgb(var(--amber-500)/<alpha-value>)', 600:'rgb(var(--amber-600)/<alpha-value>)', 700:'rgb(var(--amber-700)/<alpha-value>)', 800:'rgb(var(--amber-800)/<alpha-value>)', 900:'rgb(var(--amber-900)/<alpha-value>)' },
      sky:     { 600:'rgb(var(--sky-600)/<alpha-value>)', 700:'rgb(var(--sky-700)/<alpha-value>)' },
      teal:    { 600:'rgb(var(--teal-600)/<alpha-value>)', 700:'rgb(var(--teal-700)/<alpha-value>)' },
      purple:  { 700:'rgb(var(--purple-700)/<alpha-value>)' },
    },
    fontFamily: {
      sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      display: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
    },
    boxShadow: {
      '2xs': '0 1px 1px 0 rgb(var(--shadow-c) / var(--shadow-a2))',
      xs:    '0 1px 2px 0 rgb(var(--shadow-c) / var(--shadow-a))',
      lg:    '0 10px 25px -5px rgb(var(--shadow-c) / var(--shadow-a-lg)), 0 8px 10px -6px rgb(var(--shadow-c) / var(--shadow-a-lg))',
    },
  } },
};
