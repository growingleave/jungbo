// 몸체 부품 STL 만들기: node make_parts.cjs
const fs = require('fs');
const g = require('./geom.cjs');
const P = JSON.parse(fs.readFileSync(__dirname + '/params.json', 'utf8'));
const { plate: pl, sensor: sn, holder: ho, motor: mo, caster: ca, battery: ba, standoff: so } = P;
const hd = pl.holeDia / 2;
const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
const out = {};
// ---- 센서 홀더: 로컬 좌표 u(접선), v(바깥쪽), w(위) ----
const slotW = sn.boardThickness + ho.slotClearance, front = sn.frontRadius - sn.holderCenterRadius;
const vc = front - sn.boardThickness / 2, vs0 = vc - slotW / 2, vs1 = vc + slotW / 2;
const pocketU = sn.boardWidth + ho.pocketClearance, wu = pocketU / 2 + ho.wallThickness;
const holderTris = [];
{
  const baseHoles = [-1, 1].map(s => g.circle(s * sn.holderScrewU, -0.5, hd, 32));
  holderTris.push(...g.extrude([[-ho.baseHalfU, ho.baseV0], [ho.baseHalfU, ho.baseV0], [ho.baseHalfU, ho.baseV1], [-ho.baseHalfU, ho.baseV1]], baseHoles, 0, ho.baseThickness));
  const z0 = ho.baseThickness - 0.01, z1 = ho.baseThickness + ho.wallHeight;
  holderTris.push(...g.box(-wu, wu, vs0 - ho.wallThickness, vs0, z0, z1));        // 뒤 벽
  holderTris.push(...g.box(-wu, wu, vs1, vs1 + ho.wallThickness, z0, z1));        // 앞 벽
  holderTris.push(...g.box(-wu, -pocketU / 2, vs0, vs1, z0, z1));                  // 왼쪽 끝 벽
  holderTris.push(...g.box(pocketU / 2, wu, vs0, vs1, z0, z1));                    // 오른쪽 끝 벽
}
out.sensor_holder = holderTris;
// ---- 위판 ----
const sensorHoles = []; // 센서 홀더 나사 구멍 위치(판 좌표)
for (const d of sn.angles) {
  const a = d * Math.PI / 180, rad = [Math.sin(a), -Math.cos(a)], tan = [Math.cos(a), Math.sin(a)], r0 = sn.holderCenterRadius - 0.5;
  for (const s of [-1, 1]) sensorHoles.push([rad[0] * r0 + s * sn.holderScrewU * tan[0], rad[1] * r0 + s * sn.holderScrewU * tan[1]]);
}
const upperHoles = [...pl.standoffHoles, ...sensorHoles].map(([x, y]) => g.circle(x, y, hd, 40));
upperHoles.push(g.slot(-ba.zipSlotX, ba.zipSlotY, 6, 1.8, 90), g.slot(ba.zipSlotX, ba.zipSlotY, 6, 1.8, 90));
out.upper_plate = g.extrude(g.circle(0, 0, pl.radius, 180), upperHoles, 0, pl.thickness);
// ---- 아래판 (옆면을 평평하게) ----
const yc = Math.sqrt(pl.radius ** 2 - pl.flatX ** 2), ang = Math.atan2(yc, pl.flatX);
const lowerOuter = [...arc(0, 0, pl.radius, -ang, ang, 1).slice(0, 0), ...arc(0, 0, pl.radius, ang, Math.PI - ang, 90), ...arc(0, 0, pl.radius, Math.PI + ang, 2 * Math.PI - ang, 90)];
const lowerHoles = pl.standoffHoles.map(([x, y]) => g.circle(x, y, hd, 40));
for (const sx of [-1, 1]) for (const dx of [-1, 1]) for (const sy of [-1, 1]) lowerHoles.push(g.slot(sx * mo.centerX + dx * mo.zipSlotDX, sy * mo.zipSlotDY, 5, 1.8, 0));
lowerHoles.push(g.slot(0, ca.centerY - 4.5, 12, 1.8, 0), g.slot(0, ca.centerY + 4.5, 12, 1.8, 0));
out.lower_plate = g.extrude(lowerOuter, lowerHoles, 0, pl.thickness);
// ---- 스탠드오프 기둥 (붙여서 쓰는 형태: 양끝에 작은 돌기) ----
const st = [];
st.push(...g.extrude(g.circle(0, 0, so.bodyDia / 2, 48), [], 0, so.bodyHeight));
st.push(...g.extrude(g.circle(0, 0, so.pegDia / 2, 32), [], -so.pegLength, 0.01));
st.push(...g.extrude(g.circle(0, 0, so.pegDia / 2, 32), [], so.bodyHeight - 0.01, so.bodyHeight + so.pegLength));
out.standoff = st;
fs.mkdirSync(__dirname + '/stl', { recursive: true });
const info = {};
for (const [k, t] of Object.entries(out)) { g.writeSTL(`${__dirname}/stl/${k}.stl`, t, k); info[k] = { ...g.check(t), 부피cm3: (g.volume(t) / 1000).toFixed(2) }; }
console.log(JSON.stringify(info, null, 1));
fs.writeFileSync(__dirname + '/holes.json', JSON.stringify({ sensorHoles, standoff: pl.standoffHoles, slotWidth: slotW, pocketU, boardFront: sn.holderCenterRadius + front }, null, 1));
