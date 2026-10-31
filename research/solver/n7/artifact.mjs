/*
 * N7's page as a claude.ai artifact: index.html's title, styles and body, with the page's script referenced from the
 * artifact's root (the publish wraps the page in its own skeleton, and serves the solver's files beside it at the same
 * paths as in the repository, so page.mjs's relative paths hold). Prints the files to publish with it.
 *   node research/solver/n7/artifact.mjs <out.html>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODE_FILES } from './digest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), html = readFileSync(join(HERE, 'index.html'), 'utf8');
const head = html.split('<!--N7-PAGE-->')[1].split('<!--/N7-HEAD-->')[0];
const body = html.split('<body>')[1].split('</body>')[0].replace('src="./page.mjs"', 'src="research/solver/n7/page.mjs"');
if (!head || !body.includes('research/solver/n7/page.mjs')) { console.error('n7 artifact: index.html is not in the expected shape'); process.exit(1); }
writeFileSync(process.argv[2], `${head.trim()}\n${body.trim()}\n`);
const files = [...['page.mjs', 'worker.mjs', 'digest.mjs', 'data.json'].map(f => `research/solver/n7/${f}`), ...CODE_FILES];
console.log(JSON.stringify(files));
