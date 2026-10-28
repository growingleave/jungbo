const fs = require('fs');
const rows = fs.readdirSync('.').filter(f => /^out\d\.jsonl$/.test(f)).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
const M = ['s9', 's10', 's11', 's12'], Z = [26, 1, 2, 3];
const name = { s9: '단계 9', s10: '단계 10', s11: '단계 11', s12: '단계 12' };
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
console.log('완료', rows.length, '/ 128');
console.log('\n[1] 반복 실험: 120세대 안에 도착 개체가 나온 비율 (반복 수), 첫 도착 세대 중앙값, 최종 도착 개체 수 평균');
for (const z of Z) { console.log(`\n미로 ${z}`); for (const m of M) { const r = rows.filter(x => x.m === m && x.mz === z); const arr = r.filter(x => x.first !== null);
  console.log(`  ${name[m]}: 도착 ${arr.length}/${r.length}, 첫 도착 중앙값 ${med(arr.map(x => x.first)) ?? '-'}, 최종 도착 평균 ${mean(r.map(x => x.finalSolved))?.toFixed(1)}, 최소 이동 중앙값 ${med(r.filter(x => x.minLen).map(x => x.minLen))?.toFixed(0) ?? '-'}`); } }
console.log('\n[1-요약] 방식별 전체 (미로 4개 × 8회)');
for (const m of M) { const r = rows.filter(x => x.m === m); const arr = r.filter(x => x.first !== null); console.log(`  ${name[m]}: 도착 ${arr.length}/${r.length} (${(100 * arr.length / (r.length || 1)).toFixed(0)}%)`); }
console.log('\n[2] 처음 보는 미로 100개에서 최고 개체의 성공 수 (훈련에서 도착한 실행만)');
for (const m of M) { const r = rows.filter(x => x.m === m && x.trainOk); const t = r.map(x => x.testOk); console.log(`  ${name[m]}: 실행 ${r.length}개, 성공 평균 ${mean(t)?.toFixed(1)}/100, 중앙값 ${med(t)}, 최대 ${Math.max(...t, 0)}, 20칸 이하 미로에서 ${mean(r.map(x => x.testShortOk))?.toFixed(1)}/${mean(r.map(x => x.testShortN))?.toFixed(0)}`); }
const all = rows.filter(x => x.trainOk).map(x => x.testOk); console.log(`  전체: 실행 ${all.length}개, 평균 ${mean(all)?.toFixed(1)}%`);
