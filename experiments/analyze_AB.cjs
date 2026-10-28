// 실험 A·B 집계. 같은 (방식, 미로, 반복)이 두 번 기록된 경우(이어하기 때문)는 하나만 쓴다. 두 기록이 같은지도 확인한다.
const fs = require('fs');
const read = p => fs.readdirSync('.').filter(f => p.test(f)).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const med = a => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
// ---- B
const raw = read(/^results_B_w\d+\.jsonl$/), map = new Map(); let diff = 0;
for (const x of raw) { const k = x.m + '_' + x.mz + '_' + x.r; if (map.has(k)) { const y = map.get(k); if (y.first !== x.first || y.finalSolved !== x.finalSolved || y.minLen !== x.minLen) diff++; } else map.set(k, x); }
const rows = [...map.values()];
console.log(`B: 기록 ${raw.length}건 → 중복 제거 ${rows.length}건 (중복 중 결과가 다른 것 ${diff}건)`);
const M = ['s2', 's4', 's5', 's6', 's8', 's9', 's10', 's11', 's12'];
const wilson = (k, n) => { const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - s) / d, (c + s) / d]; };
console.log('\n방식 | n | 도착(150세대 안) | 95%구간 | 첫 도착 중앙값 | 도착 개체 충돌 평균 | 최단 이동거리 중앙값(cm) | 순위역전 세대/도착있는 세대');
for (const m of M) {
  const r = rows.filter(x => x.m === m), ar = r.filter(x => x.first !== null), [lo, hi] = wilson(ar.length, r.length);
  const iv = r.reduce((a, x) => a + x.inv, 0), gs = r.reduce((a, x) => a + x.gensWithSol, 0);
  console.log(`${m} | ${r.length} | ${ar.length} (${(100 * ar.length / r.length).toFixed(0)}%) | ${(100 * lo).toFixed(0)}~${(100 * hi).toFixed(0)}% | ${med(ar.map(x => x.first))} | ${mean(ar.map(x => x.bumpsMean)).toFixed(1)} | ${med(r.filter(x => x.minLen).map(x => x.minLen)).toFixed(0)} | ${iv}/${gs}`);
}
// 미로별 도착
console.log('\n미로별 도착 수 (최대 8)');
for (const m of M) console.log(m, [26, 1, 2, 3].map(z => `${z}:${rows.filter(x => x.m === m && x.mz === z && x.first !== null).length}`).join('  '));
// 요소별 짝 비교 (같은 미로·같은 반복)
const pairs = [['s2', 's4', '충돌 감점', 'bumpsMean'], ['s2', 's5', '이동 거리 항', 'minLen'], ['s6', 's8', '탐험 보상', 'arrive'], ['s8', 's9', '도착 우선 정렬 등', 'inv'], ['s9', 's10', '목표 근접 조건 제거', 'arrive'], ['s10', 's11', '이동 거리 배율', 'minLen'], ['s11', 's12', '자동 조절', 'arrive']];
console.log('\n요소별 짝 비교 (a → b)');
for (const [a, b, name, key] of pairs) {
  const get = (m, z, r) => map.get(m + '_' + z + '_' + r);
  const out = []; let n = 0;
  for (const z of [26, 1, 2, 3]) for (let r = 0; r < 8; r++) { const x = get(a, z, r), y = get(b, z, r); if (x && y) { n++; out.push([x, y]); } }
  let s;
  if (key === 'arrive') { const A = out.filter(([x]) => x.first !== null).length, B = out.filter(([, y]) => y.first !== null).length; const bw = out.filter(([x, y]) => x.first === null && y.first !== null).length, aw = out.filter(([x, y]) => x.first !== null && y.first === null).length; s = `도착 ${A}/${n} → ${B}/${n} (b만 도착 ${bw}, a만 도착 ${aw})`; }
  else if (key === 'inv') { const f = o => o.reduce((q, [x]) => q, 0); s = `순위 역전 세대 ${out.reduce((q, [x]) => q + x.inv, 0)} → ${out.reduce((q, [, y]) => q + y.inv, 0)}, 도착 ${out.filter(([x]) => x.first !== null).length} → ${out.filter(([, y]) => y.first !== null).length} / ${n}`; }
  else { const both = out.filter(([x, y]) => x[key] != null && y[key] != null); const dl = both.map(([x, y]) => y[key] - x[key]); s = `둘 다 도착한 ${both.length}쌍: ${key} 평균 ${mean(both.map(([x]) => x[key])).toFixed(1)} → ${mean(both.map(([, y]) => y[key])).toFixed(1)}, 줄어든 쌍 ${dl.filter(d => d < 0).length}, 늘어난 쌍 ${dl.filter(d => d > 0).length}`; }
  console.log(`${name} (${a}→${b}): ${s}`);
}
