// Tests for main.ts: builds tiny programs, runs the entrypoint, checks the
// answers against hand-computed expectations. Run: node test.mjs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const p8 = (v) => [1, v & 255];
const p32 = (v) => [2, v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255];
// [name, program, input, stdout, exit]
const C = [
  ['add', [...p8(2), ...p8(3), 0x10, 0x50, 0], '', '5', 0],
  ['divmin', [...p32(-2147483648), ...p8(-1), 0x13, 0x50, 0], '', '-2147483648', 0],
  ['div0', [...p8(1), ...p8(0), 0x13, 0], '', '', 4],
  ['badop', [0xff, 0], '', '', 5],
  ['under', [0x10, 0], '', '', 2],
  ['over', Array.from({ length: 257 }, () => p8(0)).flat(), '', '', 3],
  ['inend', [0x52, 0x50, 0], '', '-1', 0],
  ['shru', [...p8(-16), ...p8(2), 0x1e, 0x50, 0], '', '1073741820', 0],
  ['mem', [...p8(42), ...p8(5), 0x41, ...p8(5), 0x40, 0x50, 0], '', '42', 0],
  ['call', [0x33, 5, 0, 0x50, 0, ...p8(7), 0x34], '', '7', 0],
  ['loop', [...p8(3), 4, 0x50, ...p8(1), 0x11, 4, 0x32, 0xf7, 0xff, 3, 0], '', '321', 0],
  ['mul', [...p32(65536), ...p32(65536), 0x12, 0x50, 0], '', '0', 0],
  ['divu', [...p8(-1), ...p8(2), 0x15, 0x50, 0], '', '2147483647', 0],
  ['fall', [...p8(9), 0x50], '', '9', 9],
];
const root = mkdtempSync(join(tmpdir(), 'tsvm-'));
const I = join(root, 'in'), O = join(root, 'out');
for (const [n, prog, inp] of C) {
  const d = join(I, n);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'program.bin'), Buffer.from(prog));
  writeFileSync(join(d, 'input.bin'), inp);
}
execFileSync(process.execPath, [new URL('./main.ts', import.meta.url).pathname], {
  env: { ...process.env, MAKEFUN_INPUT_DIR: I, MAKEFUN_OUTPUT_DIR: O }, stdio: 'inherit',
});
let fail = 0;
for (const [n, , , wantOut, wantCode] of C) {
  const gotOut = readFileSync(join(O, n, 'stdout.bin'), 'utf8');
  const gotCode = +readFileSync(join(O, n, 'exit.txt'), 'utf8');
  const ok = gotOut === wantOut && gotCode === wantCode;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${n}: got ${JSON.stringify(gotOut)}/${gotCode}, want ${JSON.stringify(wantOut)}/${wantCode}`);
}
rmSync(root, { recursive: true, force: true });
console.log(fail ? `${fail} FAILED` : `all ${C.length} passed`);
process.exit(fail ? 1 : 0);
