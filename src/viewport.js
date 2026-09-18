/*
 * IS THIS A PHONE? ONE ANSWER, IN ONE PLACE.
 *
 * Detection is SCREEN WIDTH, not the user agent. A user-agent string tells you what the browser wants
 * you to think it is running on; the width tells you how much room you actually have, which is the thing
 * the layout needs to know - but width ALONE was not enough, and the case that proved it was a
 * Chromebook: see the pointer note below.
 *
 * 767 is Tailwind's `md` minus one, so a `md:` class and the WIDTH half of this always agree. The
 * pointer half has no CSS equivalent in a utility class, so anything load-bearing - the tab strip, the
 * bottom navigation - is now driven by this boolean rather than by a `md:` variant. What is left on
 * `md:` is presentation that reads either way: a two-column grid becoming one.
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
/*
 * A REAL POINTER MEANS A REAL COMPUTER, WHATEVER THE WIDTH SAYS.
 *
 * Width alone was the rule, and it sent a Chromebook to the phone layout: display scaling is common on
 * those machines, and a 1366px panel at 200% reports 683 CSS pixels - under the breakpoint, on a laptop
 * with a keyboard and a trackpad. So the width question now has a second half: is the thing pointing at
 * this a finger?
 *
 * `hover: hover` and `pointer: fine` together are what a mouse or a trackpad reports and what no phone
 * reports. A touchscreen laptop still answers yes to both, because its PRIMARY pointer is the trackpad;
 * a phone answers no to both whatever its width; and a narrow desktop window - somebody's deliberate
 * half-screen - keeps the desktop layout, which is the one case this rule changes on purpose.
 */
const MOUSE_Q = '(hover: hover) and (pointer: fine)';
export const phoneLayout = () => (typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia(PHONE_Q).matches && !window.matchMedia(MOUSE_Q).matches
  : false);

const read = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { isPhone: false, isCoarse: false, width: 1280, height: 800 };
  }
  return {
    isPhone: phoneLayout(),
    isCoarse: window.matchMedia(COARSE_Q).matches,
    width: window.innerWidth,
    height: window.innerHeight
  };
};

export function useViewport() {
  const [v, setV] = useState(read);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mqs = [window.matchMedia(PHONE_Q), window.matchMedia(COARSE_Q), window.matchMedia(MOUSE_Q)];
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
