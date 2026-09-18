/*
 * THE PAGE STAYS UP.
 *
 * There was no error boundary, so one render-time null - a result cleared to null while the step that
 * reads it was still mounted - unmounted the whole tree and left a white page with the plan still in
 * storage and no way back but a reload. The QA fuzz found exactly that once in 2,400 actions, which is
 * rare enough never to reproduce on demand and common enough that somebody will hit it.
 *
 * This catches the error, keeps everything outside it (the navigation, the other planner) alive, and
 * offers the two things that actually help: try the same screen again, which recovers from anything
 * transient, and reload, which recovers from everything else. The message names the error rather than
 * apologising, because the message is the only thing a bug report will ever contain.
 *
 * `resetKey` remounts the boundary when it changes - keyed on the active tab, so switching away from a
 * broken screen and back gives it a fresh start rather than the same fallback.
 */
import { Component } from 'react';

export class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, key: props.resetKey };
  }
  static getDerivedStateFromError(error) { return { error }; }
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }
  componentDidCatch(error, info) {
    // the console is where the component stack goes; the screen gets the message only
    console.error('a screen failed to render:', error, info && info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const message = String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error);
    return (
      <div role="alert" data-render-error className="m-4 p-5 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-900 space-y-3">
        <div>
          <strong className="block font-bold">This screen hit an error and stopped drawing.</strong>
          <span className="block text-xs text-rose-800 mt-1">Your plan is still saved. The error was: <code className="font-mono">{message}</code></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => this.setState({ error: null })}
            className="min-h-11 px-4 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer">Try again</button>
          <button type="button" onClick={() => window.location.reload()}
            className="min-h-11 px-4 rounded-lg border border-rose-300 bg-surface text-rose-800 text-xs font-bold cursor-pointer">Reload the page</button>
        </div>
      </div>
    );
  }
}
