# tiny-stack-vm

A correct, compact interpreter for make.fun's tiny stack ISA v1, written for
the "Build a tiny stack virtual machine" bounty. One run answers a whole set:
for each `/input/<id>/` it reads `program.bin` + `input.bin` and writes
`/output/<id>/stdout.bin` and `/output/<id>/exit.txt`.

Run it: `node main.ts` (Node 22; plain JavaScript, no dependencies).
Test it: `node test.mjs` (14 end-to-end cases covering the ISA's hard rules).
Small on purpose; fully deterministic.
