/*
 * THE FILE-READ TRACE (the launch plan of 1 Nov, step 0, B8: "a test's inputs are every file it reads, traced by running it
 * once under a file-read hook, so the list is not typed"). Loaded into every process and worker of a test by
 * research/tests/fast-skip.mjs (NODE_OPTIONS=--import=<this file>, with TRACE_DIR and TRACE_ROOT set); without TRACE_DIR it
 * does nothing. Each process or thread writes the repository paths it touched (TRACE_DIR/<pid>-<thread>.json): a process at
 * its exit; a worker thread each time it touches a new path, since a worker is killed without its exit when its process
 * exits first (a test that exits on the worker's message lost the worker's record on some runs: the full tier of 1 Nov):
 *   read     a file read or opened for reading, or loaded as a module (import, require, a worker's script);
 *   probe    a path whose existence or kind was asked (existsSync, stat, access), read or not;
 *   list     a directory listed (readdir, opendir);
 *   write    a path written, created, renamed or removed (a path first touched by a write is the test's output);
 *   spawn    a program other than node started as a child (git, python, a shell): its test can never be skipped.
 * Node children get the trace through NODE_OPTIONS, a custom env included; workers get it through their execArgv.
 * Paths outside TRACE_ROOT are dropped; node_modules is kept, and fast-skip.mjs reads it as package-lock.json.
 */
import fs from 'node:fs';
import cp from 'node:child_process';
import module from 'node:module';
import wt from 'node:worker_threads';
import { resolve, isAbsolute, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = process.env.TRACE_DIR, ROOT = process.env.TRACE_ROOT;
if (DIR && ROOT) {
  const SELF = fileURLToPath(import.meta.url), rawWrite = fs.writeFileSync, rawRename = fs.renameSync, eager = !wt.isMainThread;
  const seen = { read: new Set(), probe: new Set(), list: new Set(), write: new Set(), spawn: new Set() };
  const first = new Map();   // path -> the first kind it was touched by (read or write)
  const out = `${DIR}/${process.pid}-${wt.threadId}.json`;
  /* the record, written whole to a side file and renamed into place, so a thread killed part way leaves its last whole
     record (fast-skip.mjs reads only the .json files) */
  function flush() {
    try {
      const o = {}; for (const k of Object.keys(seen)) o[k] = [...seen[k]].sort();
      o.firstWrite = [...first].filter(([, k]) => k === 'write').map(([p]) => p).sort();
      rawWrite(`${out}.part`, JSON.stringify(o)); rawRename(`${out}.part`, out);
    } catch { }
  }
  const rel = p => {
    try {
      if (p == null || typeof p === 'number') return null;
      let s = p instanceof URL ? fileURLToPath(p) : Buffer.isBuffer(p) ? p.toString() : String(p);
      if (s.startsWith('file:')) s = fileURLToPath(s);
      const a = isAbsolute(s) ? s : resolve(process.cwd(), s), r = relative(ROOT, a).split('\\').join('/');
      return r.startsWith('..') || isAbsolute(r) ? null : (r || '.');
    } catch { return null; }
  };
  const note = (kind, p) => { const r = rel(p); if (r === null) return; const fresh = !seen[kind].has(r); seen[kind].add(r); if ((kind === 'read' || kind === 'write') && !first.has(r)) first.set(r, kind); if (fresh && eager) flush(); };
  const writing = flags => typeof flags === 'string' ? /[wa+]/.test(flags) : typeof flags === 'number' ? (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_APPEND)) !== 0 : false;
  const wrap = (obj, name, before) => { const f = obj[name]; if (typeof f !== 'function') return; obj[name] = function (...a) { try { before(...a); } catch { } return f.apply(this, a); }; };

  for (const name of ['readFileSync', 'readFile']) wrap(fs, name, p => note('read', p));
  wrap(fs.promises, 'readFile', p => note('read', p));
  for (const [obj, name] of [[fs, 'openSync'], [fs, 'open'], [fs.promises, 'open']]) wrap(obj, name, (p, flags) => note(writing(flags) ? 'write' : 'read', p));
  wrap(fs, 'createReadStream', p => note('read', p));
  for (const [obj, name] of [[fs, 'readdirSync'], [fs, 'readdir'], [fs, 'opendirSync'], [fs, 'opendir'], [fs.promises, 'readdir'], [fs.promises, 'opendir']]) wrap(obj, name, p => note('list', p));
  for (const [obj, name] of [[fs, 'existsSync'], [fs, 'statSync'], [fs, 'lstatSync'], [fs, 'stat'], [fs, 'lstat'], [fs, 'accessSync'], [fs, 'access'], [fs.promises, 'stat'], [fs.promises, 'lstat'], [fs.promises, 'access']]) wrap(obj, name, p => note('probe', p));
  for (const [obj, name] of [[fs, 'writeFileSync'], [fs, 'writeFile'], [fs, 'appendFileSync'], [fs, 'appendFile'], [fs, 'createWriteStream'], [fs, 'mkdirSync'], [fs, 'mkdir'], [fs, 'rmSync'], [fs, 'rm'], [fs, 'unlinkSync'], [fs, 'unlink'], [fs, 'rmdirSync'],
    [fs.promises, 'writeFile'], [fs.promises, 'appendFile'], [fs.promises, 'mkdir'], [fs.promises, 'rm'], [fs.promises, 'unlink']]) wrap(obj, name, p => note('write', p));
  for (const [obj, name] of [[fs, 'renameSync'], [fs, 'rename'], [fs, 'copyFileSync'], [fs, 'copyFile'], [fs.promises, 'rename'], [fs.promises, 'copyFile'], [fs, 'cpSync']])
    wrap(obj, name, (a, b) => { if (/^(copyFile|cp)/.test(name)) note('read', a); else note('write', a); note('write', b); });

  // modules: ESM and CommonJS alike (module.registerHooks, synchronous, this thread)
  if (typeof module.registerHooks === 'function') module.registerHooks({ load(url, ctx, next) { if (url.startsWith('file:')) note('read', url); return next(url, ctx); } });

  // children: a node child carries the trace in NODE_OPTIONS, whatever env it is given; any other program is a spawn
  const PRELOAD = `--import=${SELF}`;
  const isNode = c => { const s = String(c || ''); return s === process.execPath || basename(s) === 'node' || basename(s) === basename(process.execPath); };
  const withTrace = env => { const e = { ...(env || process.env) }; e.TRACE_DIR = DIR; e.TRACE_ROOT = ROOT; if (!String(e.NODE_OPTIONS || '').includes(PRELOAD)) e.NODE_OPTIONS = `${e.NODE_OPTIONS || ''} ${PRELOAD}`.trim(); return e; };
  const argsOpts = (a, at) => { const args = Array.isArray(a[at]) ? a[at] : null, oi = args ? at + 1 : at, opts = a[oi] && typeof a[oi] === 'object' && !Array.isArray(a[oi]) ? a[oi] : null; return { args, oi, opts }; };
  for (const name of ['spawn', 'spawnSync', 'execFile', 'execFileSync', 'fork']) {
    const f = cp[name];
    cp[name] = function (cmd, ...rest) {
      const node = name === 'fork' || isNode(cmd);
      if (!node) { seen.spawn.add(String(cmd)); if (eager) flush(); }
      else { const { oi, opts } = argsOpts([cmd, ...rest], 1); const o = { ...(opts || {}), env: withTrace(opts && opts.env) }; const a = [cmd, ...rest]; if (opts) a[oi] = o; else a.splice(oi, 0, o); return f.apply(this, a); }
      return f.apply(this, [cmd, ...rest]);
    };
  }
  for (const name of ['exec', 'execSync']) wrap(cp, name, cmd => { seen.spawn.add(String(cmd).split(/\s+/)[0]); if (eager) flush(); });
  // workers: their own thread, so their own hooks; execArgv carries the trace (a worker does not run NODE_OPTIONS' --import)
  const W = wt.Worker;
  if (W) wt.Worker = class extends W { constructor(file, opts = {}) { note('read', typeof file === 'string' && !opts.eval ? file : null); super(file, { ...opts, execArgv: [...(opts.execArgv || process.execArgv), PRELOAD], env: opts.env === wt.SHARE_ENV ? opts.env : withTrace(opts.env) }); } };

  // the named imports of node:fs, node:child_process and node:worker_threads read the patched functions too
  module.syncBuiltinESMExports();
  process.on('exit', flush);
}
