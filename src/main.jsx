import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/*
 * THE FONTS ARE OURS, NOT GOOGLE'S.
 *
 * These were <link>ed from fonts.googleapis.com, which meant every visitor's IP address and user agent
 * reached a third party before they had typed anything. On a tool people fill with their salary and
 * their pension balances, the only defensible answer to "who else sees this?" is nobody, and one
 * external request was the whole of the exception. Self-hosted, the page makes no third-party call at
 * all, so the promise in the footer - everything is modelled and your plan stays in this browser - is
 * now true of the network too.
 *
 * @fontsource ships the same Google-authored files under the SIL Open Font License, which permits
 * redistribution. The latin subsets only: the app is an English-language UK tax model, and the other
 * subsets would be ~1MB of glyphs nothing renders. Each face is ~24KB and Vite fingerprints it, so a
 * repeat visit pays nothing.
 *
 * The @font-face rules land in the bundled stylesheet the page already loads, rather than a second
 * stylesheet from another origin - which is what the media="print" trick in index.html used to be
 * working around. font-display: swap is in these files already, so text still paints immediately in the
 * fallback and swaps when the face arrives.
 */
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-700.css'
import '@fontsource/newsreader/latin-600-italic.css'
import '@fontsource/newsreader/latin-700-italic.css'
import './index.css'
import Shell from './Shell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
)
