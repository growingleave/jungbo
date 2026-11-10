// 1:1 설계도용 배치 계산 + 겹침 검사. 좌표 단위 mm, 판 중심이 (0,0), 앞쪽이 -y.
const rect = (name, cx, cy, w, h, deg = 0, layer) => ({ name, cx, cy, w, h, deg, layer });
const rot = (x, y, deg) => { const a = deg * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
const poly = r => [[-r.w / 2, -r.h / 2], [r.w / 2, -r.h / 2], [r.w / 2, r.h / 2], [-r.w / 2, r.h / 2]].map(([x, y]) => { const [a, b] = rot(x, y, r.deg); return [a + r.cx, b + r.cy]; });
function sat(p, q, gap = 0) { // 두 볼록 다각형 사이 간격(분리축 검사). gap보다 가까우면 true
  for (const poly1 of [p, q]) for (let i = 0; i < poly1.length; i++) {
    const [x1, y1] = poly1[i], [x2, y2] = poly1[(i + 1) % poly1.length]; const nx = y2 - y1, ny = x1 - x2, L = Math.hypot(nx, ny);
    const proj = pl => pl.map(([x, y]) => (x * nx + y * ny) / L); const a = proj(p), b = proj(q);
    if (Math.min(...a) - Math.max(...b) > gap || Math.min(...b) - Math.max(...a) > gap) return false;
  }
  return true;
}
const R = 50;                                   // 판 반지름
const upper = [], lower = [];
// 위층: 센서 모듈 5개는 판 가장자리 안쪽에 세워서(바닥 면적 12×5) 바깥을 보게 붙인다
const sensorDeg = [-90, -45, 0, 45, 90];
for (const d of sensorDeg) { const rs = 46, a = d * Math.PI / 180; upper.push(rect(`ToF ${d}°`, rs * Math.sin(a), -rs * Math.cos(a), 12, 5, d, 'u')); }
upper.push(rect('Arduino Nano', 0, -17, 45, 18, 0, 'u'));
upper.push(rect('AAA×3 홀더', 0, 18, 58, 37, 0, 'u'));
const holes = [[-30, -14], [30, -14], [-38, 22], [38, 22]];
// 아래층
lower.push(rect('N20 모터 L', -31.5, 0, 27, 12, 0, 'l'));
lower.push(rect('N20 모터 R', 31.5, 0, 27, 12, 0, 'l'));
lower.push(rect('TB6612', 0, -23, 20, 20, 0, 'l'));
lower.push(rect('5V 승압', 0, 22, 25, 16, 0, 'l'));
lower.push(rect('콘덴서', -26, 31, 8, 8, 0, 'l'));
lower.push(rect('캐스터', 0, 42, 10, 10, 0, 'l'));
module.exports = { upper, lower, holes, R, poly, sat };
if (require.main === module) {
  const bad = [];
  for (const [name, set] of [['위층', upper], ['아래층', lower]]) {
    for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) if (sat(poly(set[i]), poly(set[j]), 1)) bad.push(`${name}: ${set[i].name} ↔ ${set[j].name} 1mm 안`);
    for (const r of set) { const far = Math.max(...poly(r).map(([x, y]) => Math.hypot(x, y))); console.log(name, r.name.padEnd(14), '판 중심에서 가장 먼 모서리', far.toFixed(1), 'mm'); }
    for (const h of holes) for (const r of set) if (sat(poly(r), poly(rect('h', h[0], h[1], 6, 6, 0)), 0)) bad.push(`${name}: 구멍 (${h}) ↔ ${r.name}`);
  }
  console.log(bad.length ? '문제:\n' + bad.join('\n') : '겹침 없음');
}
