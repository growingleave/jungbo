// 간단한 3D 프린트용 메시 도구 (외부 라이브러리 없음): 구멍 있는 2D 도형 압출, 상자, 원기둥, STL 저장, 물샘 검사
const fs = require('fs');
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
const ccw = r => area(r) > 0 ? r.slice() : r.slice().reverse();
const cw = r => area(r) < 0 ? r.slice() : r.slice().reverse();
const circle = (cx, cy, rad, n = 48) => Array.from({ length: n }, (_, i) => [cx + rad * Math.cos(2 * Math.PI * i / n), cy + rad * Math.sin(2 * Math.PI * i / n)]);
function slot(cx, cy, len, wid, deg = 0, n = 10) { // 둥근 끝 홈 (len: 전체 길이, wid: 폭)
  const r = wid / 2, h = len / 2 - r, pts = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; pts.push([h + r * Math.cos(a), r * Math.sin(a)]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + Math.PI * i / n; pts.push([-h + r * Math.cos(a), r * Math.sin(a)]); }
  const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}
const rectPoly = (cx, cy, w, h, deg = 0) => { const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]); };
const segInt = (p, q, r, s) => { // 선분 pq와 rs가 (끝점 제외하고) 교차하는가
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p, q, r), d2 = d(p, q, s), d3 = d(r, s, p), d4 = d(r, s, q), e = 1e-9;
  return ((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e));
};
function triangulate(outerIn, holesIn) {
  const outer = ccw(outerIn), holes = holesIn.map(cw);
  let ring = outer.map(p => p.slice());
  const edgesOf = rs => rs.flatMap(r => r.map((p, i) => [p, r[(i + 1) % r.length]]));
  const order = holes.map((h, i) => ({ h, i, mx: Math.max(...h.map(p => p[0])) })).sort((a, b) => b.mx - a.mx);
  const allEdges = edgesOf([outer, ...holes]);
  for (const { h } of order) {
    let mi = 0; for (let i = 1; i < h.length; i++) if (h[i][0] > h[mi][0]) mi = i;
    const M = h[mi]; let best = -1, bd = Infinity;
    ring.forEach((v, i) => {
      const d = (v[0] - M[0]) ** 2 + (v[1] - M[1]) ** 2; if (d >= bd) return;
      for (const [a, b] of allEdges) { if ((a === v || b === v) || (a === M || b === M)) continue; if (a[0] === v[0] && a[1] === v[1]) continue; if (b[0] === v[0] && b[1] === v[1]) continue; if (a[0] === M[0] && a[1] === M[1]) continue; if (b[0] === M[0] && b[1] === M[1]) continue; if (segInt(M, v, a, b)) return; }
      best = i; bd = d;
    });
    if (best < 0) throw new Error('구멍 연결 실패');
    const hs = []; for (let k = 0; k <= h.length; k++) hs.push(h[(mi + k) % h.length]);
    ring = [...ring.slice(0, best + 1), ...hs, ring[best], ...ring.slice(best + 1)];
  }
  // 귀 자르기
  const idx = ring.map((_, i) => i), tris = [], P = i => ring[i];
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (a, b, c, p) => { const e = 1e-7; return cross(a, b, p) > e && cross(b, c, p) > e && cross(c, a, p) > e; };
  let guard = 0;
  while (idx.length > 3 && guard++ < 200000) {
    let cut = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = P(i0), b = P(i1), c = P(i2);
      if (cross(a, b, c) <= 1e-9) continue;
      let ok = true;
      for (const j of idx) { if (j === i0 || j === i1 || j === i2) continue; const p = P(j); if ((p[0] === a[0] && p[1] === a[1]) || (p[0] === b[0] && p[1] === b[1]) || (p[0] === c[0] && p[1] === c[1])) continue; if (inside(a, b, c, p)) { ok = false; break; } }
      if (!ok) continue;
      tris.push([a, b, c]); idx.splice(k, 1); cut = true; break;
    }
    if (!cut) { // 막히면 가장 덜 나쁜 점을 제거
      const k = 0; const i0 = idx[idx.length - 1], i1 = idx[k], i2 = idx[1]; if (cross(P(i0), P(i1), P(i2)) > 1e-9) tris.push([P(i0), P(i1), P(i2)]); idx.splice(k, 1);
    }
  }
  if (idx.length === 3 && cross(P(idx[0]), P(idx[1]), P(idx[2])) > 1e-9) tris.push([P(idx[0]), P(idx[1]), P(idx[2])]);
  return tris;
}
function extrude(outer, holes, z0, z1) {
  const T = [], o = ccw(outer), hs = holes.map(cw);
  for (const [a, b, c] of triangulate(o, hs)) { T.push([[a[0], a[1], z1], [b[0], b[1], z1], [c[0], c[1], z1]]); T.push([[a[0], a[1], z0], [c[0], c[1], z0], [b[0], b[1], z0]]); }
  const side = (r) => r.forEach((p, i) => { const q = r[(i + 1) % r.length]; T.push([[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1]]); T.push([[p[0], p[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]]); });
  side(o); hs.forEach(side); return T;
}
const box = (x0, x1, y0, y1, z0, z1) => extrude([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], [], z0, z1);
function writeSTL(file, tris, name = 'part') {
  const buf = Buffer.alloc(84 + tris.length * 50); buf.write(name.slice(0, 79), 0); buf.writeUInt32LE(tris.length, 80);
  tris.forEach((t, i) => { const [a, b, c] = t, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(x => x / l); const o = 84 + i * 50; [...n, ...a, ...b, ...c].forEach((x, k) => buf.writeFloatLE(x, o + k * 4)); buf.writeUInt16LE(0, o + 48); });
  fs.writeFileSync(file, buf);
}
function check(tris) { // 모든 변이 정확히 두 삼각형에 반대 방향으로 쓰였는지(물샘 없는 닫힌 모양인지)
  const key = p => p.map(v => v.toFixed(4)).join(','), m = new Map(); let degenerate = 0;
  for (const t of tris) { const ks = t.map(key); if (new Set(ks).size < 3) { degenerate++; continue; } for (let i = 0; i < 3; i++) { const a = ks[i], b = ks[(i + 1) % 3], k = a < b ? a + '|' + b : b + '|' + a, d = a < b ? 1 : -1; m.set(k, (m.get(k) || 0) + d); } }
  let bad = 0; for (const v of m.values()) if (v !== 0) bad++; return { tris: tris.length, openEdges: bad, degenerate };
}
function volume(tris) { let v = 0; for (const [a, b, c] of tris) v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6; return v; }
module.exports = { circle, slot, rectPoly, extrude, box, writeSTL, check, volume, triangulate };
