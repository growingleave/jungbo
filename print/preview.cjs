// STL 부품을 조립 위치에 놓고 보기 (미리보기 그림)
const fs = require('fs');
const g = require('./geom.cjs');
const P = JSON.parse(fs.readFileSync(__dirname + '/params.json', 'utf8'));
const readSTL = f => { const b = fs.readFileSync(f), n = b.readUInt32LE(80), t = []; for (let i = 0; i < n; i++) { const o = 84 + i * 50, v = k => [b.readFloatLE(o + 12 + k * 12), b.readFloatLE(o + 16 + k * 12), b.readFloatLE(o + 20 + k * 12)]; t.push([v(0), v(1), v(2)]); } return t; };
const place = (tris, fn) => tris.map(t => t.map(fn));
const add = (list, tris, color) => tris.forEach(t => list.push({ t, color }));
const up = readSTL('stl/upper_plate.stl'), lo = readSTL('stl/lower_plate.stl'), hold = readSTL('stl/sensor_holder.stl'), st = readSTL('stl/standoff.stl');
const items = [];
const zLo = 22, zUp = 54;
add(items, place(lo, ([x, y, z]) => [x, y, z + zLo]), '#8aa2c8');
add(items, place(up, ([x, y, z]) => [x, y, z + zUp]), '#9fb7d6');
for (const [x, y] of P.plate.standoffHoles) add(items, place(st, ([a, b, z]) => [a + x, b + y, z + zLo + P.plate.thickness]), '#d0d4da');
for (const d of P.sensor.angles) {
  const a = d * Math.PI / 180, rad = [Math.sin(a), -Math.cos(a)], tan = [Math.cos(a), Math.sin(a)], r = P.sensor.holderCenterRadius;
  const T = ([u, v, w]) => [rad[0] * (r + v) + tan[0] * u, rad[1] * (r + v) + tan[1] * u, w + zUp + P.plate.thickness];
  add(items, place(hold, T), '#e8a317');
  // 센서 보드 (가로 25, 높이 13, 두께 1.6) 가 홀더 홈에 선 모습
  const front = P.sensor.frontRadius - r, vc = front - P.sensor.boardThickness / 2, bw = P.sensor.boardWidth / 2, bt = P.sensor.boardThickness / 2, z0 = P.holder.baseThickness, z1 = z0 + 13;
  add(items, place(g.box(-bw, bw, vc - bt, vc + bt, z0, z1), T), '#7048e8');
}
const az = 38 * Math.PI / 180, el = 32 * Math.PI / 180;
const proj = ([x, y, z]) => { const x1 = x * Math.cos(az) - y * Math.sin(az), y1 = x * Math.sin(az) + y * Math.cos(az); return [x1, -(z * Math.cos(el) - y1 * Math.sin(el)), y1 * Math.cos(el) + z * Math.sin(el)]; };
const light = [0.3, -0.5, 0.8];
const polys = items.map(({ t, color }) => { const p = t.map(proj), z = (p[0][2] + p[1][2] + p[2][2]) / 3; const u = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]], v = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]]; let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(...n) || 1; n = n.map(q => q / l); const sh = Math.max(0.35, Math.min(1, 0.55 + 0.45 * (n[0] * light[0] + n[1] * light[1] + n[2] * light[2]))); return { p, z, color, sh }; }).sort((a, b) => a.z - b.z);
const shade = (hex, s) => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return `rgb(${c.map(v => Math.round(v * s)).join(',')})`; };
const sc = 3.2, W = 800, H = 640;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#fff;font-family:sans-serif"><g transform="translate(${W / 2},${H / 2 + 20}) scale(${sc})">`;
for (const { p, color, sh } of polys) svg += `<polygon points="${p.map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' ')}" fill="${shade(color, sh)}" stroke="${shade(color, sh)}" stroke-width=".12"/>`;
svg += `</g><text x="12" y="24" font-size="16" font-weight="bold">조립 미리보기 (아래판, 위판, 기둥 4개, 센서 홀더 5개, 센서 보드)</text></svg>`;
fs.writeFileSync('preview.svg', svg);
fs.writeFileSync('preview.html', `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">${svg}</body></html>`);
