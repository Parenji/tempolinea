// Ogni frase passata a t('…') nel codice deve avere la traduzione inglese.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { hasEnglish } from '../src/shared/i18n';
import '../src/shared/messages.en';
import '../src/tools/timeline/messages.en';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|svelte)$/.test(p) ? [p] : [];
  });
}

describe('traduzioni', () => {
  const src = resolve(import.meta.dirname, '../src');
  const keys = new Set<string>();
  for (const f of [...files(join(src, 'shared')), ...files(join(src, 'hub')), ...files(join(src, 'tools'))]) {
    const code = readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*\*)/.test(l)).join('\n');
    for (const m of code.matchAll(/\btc\(\s*'([a-z]+)',\s*(['"])((?:\\.|(?!\2).)*)\2/g)) keys.add(`${m[1]}|${m[3].replace(/\\'/g, "'")}`);
    for (const m of code.matchAll(/\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g)) keys.add(m[2].replace(/\\'/g, "'"));
  }
  it('trova le frasi nel codice', () => expect(keys.size).toBeGreaterThan(200));
  it('ogni frase ha la traduzione inglese', () => {
    expect([...keys].filter((k) => !hasEnglish(k))).toEqual([]);
  });
});
