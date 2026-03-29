#!/usr/bin/env bun
import { runScan } from './run-scan';

const force = process.argv.includes('--force');

try {
  const r = runScan({ force });
  console.log(JSON.stringify(r, null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
