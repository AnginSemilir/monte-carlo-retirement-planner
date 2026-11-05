/* profile-solve.mjs's start-up worker: loads the engine and the solver, as a solver worker does, and says so. */
import { parentPort } from 'node:worker_threads';
import '../engine.mjs';
import '../../src/solverApp.js';
parentPort.postMessage('up');
