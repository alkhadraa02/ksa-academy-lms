// Runs `prisma generate`. On Windows the query-engine DLL stays locked while a
// server using the generated client is running (EPERM on rename). In that case
// an already generated client is reused instead of failing the whole build.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const run = spawnSync("npx", ["prisma", "generate"], { encoding: "utf8", shell: true });
process.stdout.write(run.stdout ?? "");
process.stderr.write(run.stderr ?? "");

if (run.status === 0) process.exit(0);

const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
const locked = /EPERM|EBUSY/.test(output);
const generated = existsSync("node_modules/.prisma/client/index.js");
if (locked && generated) {
  console.warn("prisma generate skipped: engine file is locked by a running server; reusing the existing client.");
  process.exit(0);
}
process.exit(run.status ?? 1);
