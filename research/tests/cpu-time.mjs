// The CPU time a piece of work takes on this thread, in nanoseconds a repetition, over `trials` runs: `first` the first run's
// (cold, as a check that timed one run measured it) and `best` the least (warm, and clear of the runs a neighbour on the
// same core slowed). A speed check that reads the wall clock fails whenever other work shares the cores, as the gate's
// engine suites do beside the batches (1 Nov, B1's gate on dcda5e7: solver-fast's C2 read 925 to 1,915 ns a year under
// load, 5 runs in 6 over its 1,000, against 830 alone), where what such a check is about is the work's own cost.
const now = typeof process.threadCpuUsage === 'function' ? () => process.threadCpuUsage() : () => process.cpuUsage();

export function cpuNs(work, reps, trials = 5) {
  let first = NaN, best = Infinity;
  for (let k = 0; k < trials; k++) {
    const c0 = now();
    work();
    const c1 = now();
    const ns = ((c1.user - c0.user) + (c1.system - c0.system)) * 1e3 / reps;
    if (k === 0) first = ns;
    best = Math.min(best, ns);
  }
  return { first, best };
}
