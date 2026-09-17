/*
 * A HORIZONTAL SWIPE, AND ONLY WHEN IT COULD NOT HAVE MEANT ANYTHING ELSE.
 *
 * Material's one warning about swipeable tabs is that a horizontally-swipeable thing inside them makes
 * the user swipe the wrong one. On this site those things are real: a range slider, a native select, a
 * table that scrolls sideways, the sandbox sheet being dragged. So a swipe only counts when
 *
 *   - it moved at least 48px sideways and less than half that vertically, so a scroll with a wobble in
 *     it is a scroll;
 *   - it started more than 24px from either screen edge, because iOS Safari owns edge swipes for
 *     back and forward and fighting it loses;
 *   - it did not start inside [data-no-swipe], a range input, a select, or any element that actually
 *     scrolls sideways (scrollWidth past clientWidth), which is the generic form of the rule above.
 *
 * The listeners sit on the document and ask whether the gesture began inside the container, rather than
 * on the container itself. The container is a tab's content, which React mounts and unmounts as tabs
 * change, and a listener attached to an element that is about to be replaced is a listener on nothing.
 *
 * `touch-action: pan-y` on the container (the .swipe-x class in index.html) is the other half: it tells
 * the browser to keep vertical scrolling native and leave horizontal movement to us, so the swipe fires
 * at all and vertical scroll never stutters.
 */
import { useEffect, useRef } from 'react';

const THRESHOLD = 48;
const EDGE = 24;

const startsSomewhereItShouldNot = (target, container) => {
  let el = target;
  while (el && el !== container) {
    if (el.nodeType === 1) {
      if (el.hasAttribute('data-no-swipe')) return true;
      const tag = el.tagName;
      if (tag === 'SELECT' || (tag === 'INPUT' && el.type === 'range')) return true;
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible') return true;
    }
    el = el.parentNode;
  }
  return false;
};

export function useSwipe(ref, { onLeft, onRight, enabled = true }) {
  const handlers = useRef({ onLeft, onRight });
  handlers.current = { onLeft, onRight };
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;
    let start = null;
    const down = (e) => {
      const c = ref.current;
      if (!c || !c.contains(e.target)) return;
      if (e.pointerType === 'mouse') return;                       // a mouse drags text, it does not swipe
      if (e.clientX < EDGE || e.clientX > window.innerWidth - EDGE) return;
      if (startsSomewhereItShouldNot(e.target, c)) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      start = null;
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < 2 * Math.abs(dy)) return;
      const h = handlers.current;
      if (dx < 0) { if (h.onLeft) h.onLeft(); } else if (h.onRight) h.onRight();
    };
    const cancel = () => { start = null; };
    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointercancel', cancel, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', cancel);
    };
  }, [ref, enabled]);
}
