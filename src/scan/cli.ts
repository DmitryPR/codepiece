#!/usr/bin/env bun
import { runScan } from './run-scan';

try {
  const r = runScan();
  console.log(JSON.stringify(r, null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
