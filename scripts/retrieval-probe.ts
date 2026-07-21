import { searchVerses } from '@/lib/gita-search';

// Thematic probes: a natural-language query paired with the verses a Gita
// scholar would consider canonical for it. "Better" = the canonical verse
// appears in the top 5. This is the accuracy gate for any retrieval change.
const PROBES: { query: string; expect: string[] }[] = [
  { query: 'I am anxious about the results of my work', expect: ['2-47', '2-48'] },
  { query: 'how do I control a restless and wandering mind', expect: ['6-34', '6-35', '6-26'] },
  { query: 'anger clouds my judgment and I lose myself', expect: ['2-63', '16-21'] },
  { query: 'everything feels impermanent, pleasure and pain keep coming and going', expect: ['2-14'] },
  { query: 'act without being attached to the reward', expect: ['2-47', '3-19'] },
  { query: 'who am I really, the soul beyond the body', expect: ['2-20', '2-13'] },
  { query: 'I am afraid and my courage is failing me', expect: ['2-3'] },
  { query: 'what is my duty when I do not want to act', expect: ['3-35', '18-47', '2-31'] },
];

const main = async () => {
  let hits = 0;
  for (const probe of PROBES) {
    const results = await searchVerses(probe.query, 5);
    const refs = results.map((r) => `${r.chapter}-${r.verse}`);
    const hit = probe.expect.some((e) => refs.includes(e));
    if (hit) hits += 1;
    console.log(`${hit ? '✓' : '✗'} "${probe.query}"`);
    console.log(`    expected one of ${probe.expect.join(', ')}`);
    console.log(`    top 5: ${refs.join(', ') || '(none)'}\n`);
  }
  console.log(`SCORE: ${hits}/${PROBES.length} probes hit a canonical verse in top 5`);
  process.exit(0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
