// Smoke tests for main.ts (8 cases). Run: node test.mjs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// [name, program, input, stdout, exit]
const C = [
  ['add', [1, 2, 1, 3, 16, 80, 0], '', '5', 0],
  ['divmin', [2, 0, 0, 0, 128, 1, 255, 19, 80, 0], '', '-2147483648', 0],
  ['div0', [1, 1, 1, 0, 19, 0], '', '', 4],
  ['badop', [255, 0], '', '', 5],
  ['over', Array(257).fill([1, 0]).flat(), '', '', 3],
  ['shru', [1, 240, 1, 2, 30, 80, 0], '', '1073741820', 0],
  ['mem', [1, 42, 1, 5, 65, 1, 5, 64, 80, 0], '', '42', 0],
  ['call', [51, 5, 0, 80, 0, 1, 7, 52], '', '7', 0],
];
const r = mkdtempSync(join(tmpdir(), 'tsvm-'));
const I = join(r, 'in'), O = join(r, 'out');
for (const [n, p, i] of C) {
  const d = join(I, n);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'program.bin'), Buffer.from(p));
  writeFileSync(join(d, 'input.bin'), i);
}
execFileSync(process.execPath, [new URL('./main.ts', import.meta.url).pathname], {
  env: { ...process.env, MAKEFUN_INPUT_DIR: I, MAKEFUN_OUTPUT_DIR: O },
});
let f = 0;
for (const [n, , , w, c] of C) {
  const o = readFileSync(join(O, n, 'stdout.bin'), 'utf8');
  const e = +readFileSync(join(O, n, 'exit.txt'), 'utf8');
  const ok = o === w && e === c;
  if (!ok) f++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + n + ': ' + o + '/' + e + ' want ' + w + '/' + c);
}
rmSync(r, { recursive: true, force: true });
console.log(f ? f + ' FAILED' : 'all ' + C.length + ' passed');
process.exit(f ? 1 : 0);
