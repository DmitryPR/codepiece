import { createHash } from 'crypto';

export function stableCardId(repoLabel: string, sourcePath: string, symbolName: string): string {
  const h = createHash('sha256');
  h.update(`${repoLabel}\0${sourcePath}\0${symbolName}`);
  return h.digest('hex').slice(0, 32);
}
