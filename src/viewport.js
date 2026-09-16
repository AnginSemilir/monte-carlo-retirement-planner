/*
 * IS THIS A PHONE? ONE ANSWER, IN ONE PLACE.
 *
 * Detection is SCREEN WIDTH, not the user agent. A user-agent string tells you what the browser wants
 * you to think it is running on; the width tells you how much room you actually have, which is the thing
 * the layout needs to know. It also means a narrow desktop window gets the phone layout, which is
 * correct rather than a side effect: at 500px the eight-tab strip wraps and the charts are cramped
 * whatever the machine.
 *
 * 767 is Tailwind's `md` minus one, so a `md:` class and `isPhone` always agree. That matters because
 * some of this is done in CSS (`hidden md:flex`) and some in JS, and a boundary mismatch would leave a
 * band of widths where the two disagree - two tab bars, or none.
 *
 * `isCoarse` is a SEPARATE question: it asks whether the pointer is a finger, and it drives touch-target
 * sizes rather than layout. A tablet or a touchscreen laptop is not a phone but still needs 44px
 * buttons, and a phone emulator driven by a mouse is a phone that does not.
 *
 * The initial state is read synchronously in the useState initialiser rather than in an effect. This app
 * is client-only (src/main.jsx mounts with createRoot, there is no SSR), so `window` exists on the first
 * render and reading it there is safe - and it avoids a frame of desktop layout on a phone, which would
 * be a visible flash of a wrapped tab bar before the bottom nav appeared.
 */
import { useState, useEffect } from 'react';

export const PHONE_MAX = 767;                       // Tailwind `md` - 1. Must stay in step with `md:`.
const PHONE_Q = `(max-width: ${PHONE_MAX}px)`;
const COARSE_Q = '(pointer: coarse)';

const read = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { isPhone: false, isCoarse: false, width: 1280, height: 800 };
  }
  return {
    isPhone: window.matchMedia(PHONE_Q).matches,
    isCoarse: window.matchMedia(COARSE_Q).matches,
    width: window.innerWidth,
    height: window.innerHeight
  };
};

export function useViewport() {
  const [v, setV] = useState(read);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mqs = [window.matchMedia(PHONE_Q), window.matchMedia(COARSE_Q)];
    const update = () => setV(read());
    mqs.forEach(m => m.addEventListener('change', update));
    // resize as well as the media queries: width/height feed the chart boxes, which have to follow a
    // rotation or a window drag, not just a crossing of the 767px line.
    window.addEventListener('resize', update);
    return () => {
      mqs.forEach(m => m.removeEventListener('change', update));
      window.removeEventListener('resize', update);
    };
  }, []);
  return v;
}
