/*
 * THE THEME, OWNED IN ONE PLACE AND USED BY BOTH APPS.
 *
 * This lived inside App.jsx, which meant the streamlined page had no way to change it: the switch at the
 * top of the shell unmounted the only component that held the preference, so a visitor who preferred dark
 * kept it only as long as they stayed in the full planner. Both pages are styled from the same CSS
 * variables, so both were always capable of it - the control was simply somewhere the other page could
 * not reach.
 *
 * The shell now calls useTheme once and hands the result to whichever app is mounted, so there is exactly
 * one source of truth, one listener on the OS setting, and one thing writing the document attribute.
 */
import { useState, useEffect } from 'react';
import { Sun, Moon, Coffee } from 'lucide-react';

export const THEME_STORAGE_KEY = 'rp_theme_v1';

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/*
 * `theme` is what the household chose - light, dark, sepia, or 'system', which follows the machine.
 * `resolvedTheme` is which designed palette that currently means, and it is the only thing the document
 * is ever stamped with. On 'system' it keeps listening: a laptop that turns dark at sunset takes the page
 * with it.
 *
 * SEPIA REPLACED THE FOLLOW-THE-DEVICE BUTTON, AND THAT IS A REAL TRADE.
 *
 * The button showed a screen icon and, on a machine set to light, produced a page indistinguishable from
 * the light theme - a third of the control doing nothing visible. It is gone from the toggle, so once
 * somebody picks a theme the page stops following their machine. What is kept is the part that matters
 * most: 'system' is still the state of anyone who has never chosen, which is almost everyone, so a laptop
 * that goes dark at sunset still takes the page with it until its owner expresses a preference.
 *
 * The toggle therefore presses the RESOLVED theme rather than the stored one, because on 'system' the
 * stored value matches none of the three buttons and an unpressed row would read as broken.
 *
 * 'classic' was a third theme and maps to light, which is what it collapsed into. The anti-FOUC script in
 * index.html carries the same mapping and has to agree with this, or the page flashes on load.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = get(THEME_STORAGE_KEY);
    if (saved === 'classic') return 'light';
    if (saved === 'light' || saved === 'dark' || saved === 'sepia' || saved === 'system') return saved;
    return 'system';
  });
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    // the PREFERENCE is stored, not what it resolved to: storing 'dark' for somebody on 'system' would
    // freeze them there the next time their machine changed its mind
    set(THEME_STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);
  return { theme, setTheme, resolvedTheme };
}

const OPTIONS = [
  { id: 'light', Icon: Sun, title: 'Light' },
  { id: 'dark', Icon: Moon, title: 'Dark' },
  { id: 'sepia', Icon: Coffee, title: 'Sepia' },
];

/*
 * `touch` grows the three buttons from 28px to 44px. A 28px target is fine under a mouse and too small
 * under a thumb, and this control sits in the header of every screen, so it would otherwise be the one
 * thing on the page a finger could not reliably hit.
 */
export function ThemeToggle({ theme, setTheme, resolvedTheme = 'light', touch = false, compact = false, className = '' }) {
  // On 'system' the stored preference matches none of the three, so press what is actually on screen.
  const shown = theme === 'system' ? resolvedTheme : theme;
  /*
   * ONE BUTTON THAT CYCLES, WHERE THREE WILL NOT FIT.
   *
   * The simple page on a phone is one screen with nothing below it, and three 44px buttons is a tenth of
   * that spent on a setting most people change once. Compact shows the theme you are in and moves to the
   * next one on a press - the same three, in the same order, through one target instead of three.
   */
  if (compact) {
    const i = Math.max(0, OPTIONS.findIndex(o => o.id === shown));
    const { Icon } = OPTIONS[i];
    const next = OPTIONS[(i + 1) % OPTIONS.length];
    return (
      <button type="button" onClick={() => setTheme(next.id)} data-theme-cycle
        title={`Theme: ${OPTIONS[i].title}. Switch to ${next.title}.`} aria-label={`Theme: ${OPTIONS[i].title}. Switch to ${next.title}.`}
        className={`min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer ${className}`}>
        <Icon className="w-4 h-4" />
      </button>
    );
  }
  return (
    <div className={`flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80 ${className}`}>
      {OPTIONS.map(({ id, Icon, title }) => (
        <button key={id} type="button" onClick={() => setTheme(id)} title={title} aria-label={title}
          aria-pressed={shown === id}
          className={`rounded-md transition-colors cursor-pointer ${touch ? 'min-h-11 min-w-11 flex items-center justify-center' : 'p-1.5'} ${shown === id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
