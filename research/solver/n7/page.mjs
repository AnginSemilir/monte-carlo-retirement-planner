/*
 * N7's page (index.html): times the solve on this device and checks its tables against Node's (build.mjs, data.json).
 * Each finished solve is kept in the page, and, inside a claude.ai artifact, added to its record (the `db` capability,
 * collection `runs`), where the research reads every device's rows back (reduce.mjs).
 */
const $ = id => document.getElementById(id);
const HERE = new URL('./', import.meta.url), ROOT = new URL('../../../', import.meta.url);
const armLabel = (arm, points) => `${arm === 'product' ? 'App' : 'Candidate'} (${points} pts)`;
const fmt = s => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${s.toFixed(1)} s`);
const mins = s => (s < 90 ? `${Math.round(s)} seconds` : s < 5400 ? `${Math.round(s / 60)} minutes` : `${(s / 3600).toFixed(1)} hours`);
const median = xs => { const a = [...xs].sort((x, y) => x - y), n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : NaN; };
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* no storage here */ } } };

const state = { data: null, codeOk: null, mode: null, worker: null, db: null, rows: [], running: false, factor: null,
  session: Math.random().toString(36).slice(2, 10) };
window.__n7 = state;   // read by the headless check (research/solver/n7/check.cjs)

function device() {
  const ua = navigator.userAgent, ud = navigator.userAgentData;
  const brands = ud && ud.brands ? ud.brands.filter(b => !/Not.?A.?Brand/i.test(b.brand)).map(b => `${b.brand} ${b.version}`).join(', ') : '';
  return { name: $('dev-name').value.trim(), ua, brands, platform: (ud && ud.platform) || navigator.platform || '', mobile: ud ? !!ud.mobile : /Mobi|Android|iPhone|iPad/.test(ua),
    cores: navigator.hardwareConcurrency || null, memoryGB: navigator.deviceMemory || null, isolated: !!globalThis.crossOriginIsolated };
}

/* the jobs of a preset, in order: each household's app solve, then its candidate solve */
function jobsOf(preset) {
  const d = state.data;
  if (preset === 'check') return [{ caseId: d.check.id, arm: 'product', points: d.check.points, plan: d.check.plan, opts: d.check.opts, ref: d.check.ref, gate5: null }];
  const cases = preset === 'quick' ? d.cases.filter(c => c.id === 'S370') : d.cases, runs = preset === 'full' ? 3 : 1, out = [];
  for (let r = 0; r < runs; r++) for (const c of cases) for (const arm of ['product', 'cand'])
    out.push({ caseId: c.id, arm, points: c[arm].opts.points, plan: c[arm].plan, opts: c[arm].opts, ref: c[arm].ref, gate5: c.gate5[arm], run: r + 1 });
  return out;
}
const gate5Secs = jobs => jobs.reduce((t, j) => t + (j.gate5 || 0), 0);
function showEtas() {
  for (const p of ['quick', 'all', 'full']) {
    const s = gate5Secs(jobsOf(p));
    $(`eta-${p}`).textContent = state.factor
      ? `About ${mins(s * state.factor)} on this device, from its first solves.`
      : `${mins(s)} on the research machine; expect more on a phone.`;
  }
}

async function checkCode() {
  try {
    const { codeOf } = await import('./digest.mjs');
    const files = await Promise.all(state.data.code.files.map(async p => { const r = await fetch(new URL(p, ROOT)); if (!r.ok) throw new Error(`${p}: ${r.status}`); return [p, await r.arrayBuffer()]; }));
    const fp = await codeOf(files);
    state.codeOk = fp === state.data.code.fingerprint;
    $('dev-code').innerHTML = state.codeOk
      ? `<span class="pill good">as built</span> <span class="mono">${fp}</span>, candidate <span class="mono">${state.data.candidate}</span>`
      : `<span class="pill bad">changed</span> the solver differs from the build (<span class="mono">${fp}</span>, built on <span class="mono">${state.data.code.fingerprint}</span>): times still count, the table check does not`;
  } catch (e) { state.codeOk = false; $('dev-code').innerHTML = `<span class="pill warn">not checked</span> ${e.message}`; }
}

async function startWorker() {
  try {
    const w = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('the worker did not start in 60 s')), 60000);
      w.onmessage = ({ data }) => { if ('ready' in data) { clearTimeout(t); data.ready ? resolve() : reject(new Error(data.error)); } };
      w.onerror = e => { clearTimeout(t); reject(new Error(e.message || 'the worker failed to load')); };
    });
    state.worker = w; state.mode = 'worker';
    $('dev-mode').innerHTML = '<span class="pill good">a worker</span> the page stays responsive while it solves';
  } catch (e) {
    state.mode = 'page';
    $('dev-mode').innerHTML = `<span class="pill warn">this page</span> the browser refused a worker (${e.message}); the page will not respond while each solve runs`;
  }
}
function solveIn(job) {
  const msg = { id: Math.random(), plan: job.plan, opts: job.opts };
  if (state.mode === 'page') return import('./worker.mjs').then(m => m.solveOnce(msg)).then(r => ({ ok: true, ...r }), e => ({ ok: false, error: String(e.message || e) }));
  return new Promise(resolve => {
    state.worker.onmessage = ({ data }) => { if (data.id === msg.id) resolve(data); };
    state.worker.onerror = e => resolve({ ok: false, error: e.message || 'the worker stopped (out of memory?)' });
    state.worker.postMessage(msg);
  });
}

async function connectDb() {
  if (!window.claude || !window.claude.use) { $('dev-db').innerHTML = '<span class="pill warn">this page only</span> outside claude.ai: copy the results when it finishes'; return; }
  const db = await window.claude.use('db');
  if (!db) { $('dev-db').innerHTML = '<span class="pill warn">this page only</span> the record is not available here: copy the results when it finishes'; return; }
  state.db = db;
  $('dev-db').innerHTML = '<span class="pill good">saving</span> each solve is added to the research record as it finishes';
}
async function save(row) {
  await state.dbReady;
  if (!state.db) return;
  try { await state.db.collection('runs').add(row); row.saved = true; }
  catch (e) { row.saved = false; $('dev-db').innerHTML = `<span class="pill bad">not saved</span> ${e.code || ''} ${e.message || e}: copy the results when it finishes`; }
}

function renderRows() {
  const tb = $('rows');
  if (!state.rows.length) return;
  tb.innerHTML = '';
  for (const r of state.rows) {
    const tr = document.createElement('tr');
    const same = !r.ok ? '<span class="bad">failed</span>' : r.same === null ? '<span class="muted">n/a</span>' : r.same ? '<span class="good">yes</span>' : '<span class="bad">no</span>';
    const cells = [r.caseId + (r.run > 1 ? ` (${r.run})` : ''), armLabel(r.arm, r.points),
      r.ok ? fmt(r.secs) : '–', r.gate5 ? fmt(r.gate5) : '–', r.ok && r.gate5 ? `x${(r.secs / r.gate5).toFixed(2)}` : '–',
      r.ok ? `${(r.bytes / 1048576).toFixed(0)} MB` : '–', same];
    cells.forEach((c, i) => { const td = document.createElement('td'); if (i === 6) td.innerHTML = c; else td.textContent = c; tr.appendChild(td); });
    if (!r.ok) tr.title = r.error;
    tb.appendChild(tr);
  }
}
function summary() {
  const ok = state.rows.filter(r => r.ok && r.gate5), sum = $('sum');
  if (!state.rows.length) return;
  $('sum-box').hidden = false;
  const by = arm => ok.filter(r => r.arm === arm);
  const ratio = rs => median(rs.map(r => r.secs / r.gate5));
  const items = [];
  const rp = ratio(by('product')), rc = ratio(by('cand'));
  if (ok.length) items.push(['Against the research machine', `the app's solve x${rp.toFixed(2)}, the candidate's x${rc.toFixed(2)} (the median ratio; above 1 is slower)`]);
  const S370 = arm => median(by(arm).filter(r => r.caseId === 'S370').map(r => r.secs));
  const mp = median(by('product').map(r => r.secs)), mc = median(by('cand').map(r => r.secs));
  if (ok.length) items.push(['One core, this device', `the app ${fmt(mp)}, the candidate ${fmt(mc)} (the median solve)`]);
  if (by('cand').length && by('product').length) {
    const split = mc / state.data.gate5.speedup, limit = 1.25 * mp;
    items.push(['Split across 4 cores', `about ${fmt(split)} if the split speeds it up as on the research machine (x${state.data.gate5.speedup}); gate 5 asks for at most ${fmt(limit)}, a quarter over the app's solve here: <span class="${split <= limit ? 'good' : 'bad'}">${split <= limit ? 'within' : 'over'}</span>. Projected, not measured: in a browser a solve runs on one core until the app's worker splits it.`]);
  }
  const checked = state.rows.filter(r => r.ok && r.same !== null);
  if (checked.length) items.push(['Same tables as the research machine', `${checked.filter(r => r.same).length} of ${checked.length} solves bit for bit`]);
  const failed = state.rows.filter(r => !r.ok);
  if (failed.length) items.push(['Failed', failed.map(r => `${r.caseId} ${r.arm}: ${r.error}`).join('; ')]);
  if (!Number.isNaN(S370('cand'))) items.push(['S370 (the largest)', `the candidate ${fmt(S370('cand'))}, its tables ${(Math.max(...by('cand').filter(r => r.caseId === 'S370').map(r => r.bytes)) / 1048576).toFixed(0)} MB`]);
  sum.innerHTML = items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}
const textOf = () => JSON.stringify({ device: device(), session: state.session, build: state.data.built, code: state.data.code.fingerprint, codeOk: state.codeOk, mode: state.mode,
  rows: state.rows.map(({ caseId, arm, points, run, ok, secs, gate5, values, bytes, moves, digest, same, error }) => ({ caseId, arm, points, run, ok, secs, gate5, values, bytes, moves, digest, same, error })) }, null, 1);

let tick = null, lock = null;
async function wake() {
  try { lock = await navigator.wakeLock.request('screen'); $('lock').textContent = 'Screen kept on.'; }
  catch { $('lock').textContent = 'Could not keep the screen on: keep it awake yourself.'; }
}
document.addEventListener('visibilitychange', () => { if (state.running && document.visibilityState === 'visible' && (!lock || lock.released)) wake(); });

async function run() {
  const preset = document.querySelector('input[name="preset"]:checked').value, jobs = jobsOf(preset);
  state.running = true; $('start').disabled = true; $('stop').disabled = false; $('now-box').hidden = false;
  store.set('n7-name', $('dev-name').value.trim());
  await wake();
  for (const [k, job] of jobs.entries()) {
    if (!state.running) break;
    const left = jobs.slice(k);
    $('now-what').textContent = `${k + 1} of ${jobs.length}: ${job.caseId}, ${armLabel(job.arm, job.points)}${job.run > 1 ? `, run ${job.run}` : ''}`;
    $('now-left').textContent = state.factor && job.gate5 ? `About ${mins(gate5Secs(left) * state.factor)} left in all.` : job.gate5 ? `${fmt(job.gate5)} on the research machine.` : '';
    const t0 = performance.now();
    $('now-clock').textContent = '0:00';
    tick = setInterval(() => { $('now-clock').textContent = fmt((performance.now() - t0) / 1000); }, 500);
    const r = await solveIn(job);
    clearInterval(tick);
    if (!state.running) break;
    const row = { caseId: job.caseId, arm: job.arm, points: job.points, run: job.run || 1, gate5: job.gate5, ok: !!r.ok, error: r.error || null,
      secs: r.ok ? +r.secs.toFixed(2) : null, values: r.values || null, bytes: r.bytes || null, moves: r.moves || null, digest: r.digest || null,
      same: r.ok && state.codeOk ? r.digest === job.ref.digest : null, ref: { digest: job.ref.digest, nodeSecs: job.ref.secs } };
    state.rows.push(row);
    const done = state.rows.filter(x => x.ok && x.gate5);
    if (done.length) { state.factor = median(done.map(x => x.secs / x.gate5)); showEtas(); }
    renderRows(); summary();
    await save({ ...row, device: device(), session: state.session, build: state.data.built, code: state.data.code.fingerprint, codeOk: state.codeOk, mode: state.mode, at: new Date().toISOString() });
    if (!r.ok && state.mode === 'worker') { state.worker.terminate(); await startWorker(); }
  }
  state.running = false; $('start').disabled = false; $('stop').disabled = true; $('now-box').hidden = true;
  if (lock) { lock.release().catch(() => {}); lock = null; $('lock').textContent = ''; }
}
async function stop() {
  state.running = false; clearInterval(tick);
  if (state.worker) { state.worker.terminate(); state.worker = null; await startWorker(); }
  $('start').disabled = false; $('stop').disabled = true; $('now-box').hidden = true;
}

async function boot() {
  const d = device();
  $('dev-ua').textContent = d.brands ? `${d.brands} on ${d.platform}` : d.ua;
  $('dev-cores').textContent = `${d.cores || 'unknown'} logical${d.memoryGB ? `, about ${d.memoryGB} GB memory` : ''}${d.isolated ? '' : '; shared memory off (one core per solve)'}`;
  $('dev-name').value = store.get('n7-name') || '';
  const res = await fetch(new URL('data.json', HERE));
  state.data = await res.json();
  $('ref-note').textContent = `Research machine: gate 5's quiet-machine times (code ${state.data.gate5.code}), Node on one core. The page was built ${state.data.built.slice(0, 16).replace('T', ' ')} UTC.`;
  showEtas();
  // #run-quick, #run-all, #run-full, #run-check choose that run and start it (the headless check uses #run-check)
  const auto = /^#run-(quick|all|full|check)$/.exec(location.hash);
  if (auto) $(`p-${auto[1]}`).checked = true;
  state.dbReady = connectDb();
  await Promise.all([checkCode(), startWorker()]);
  $('start').disabled = false;
  $('start').addEventListener('click', run);
  $('stop').addEventListener('click', stop);
  $('copy').addEventListener('click', async () => {
    const t = textOf(), out = $('out');
    try { await navigator.clipboard.writeText(t); $('copied').textContent = 'Copied.'; }
    catch { out.hidden = false; out.value = t; out.select(); $('copied').textContent = 'Select the text below and copy it.'; }
  });
  if (auto) run();
}
boot().catch(e => { $('dev-mode').innerHTML = `<span class="pill bad">failed</span> ${e.message}`; });
