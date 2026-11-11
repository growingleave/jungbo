// 몸체 제작도 (치수·좌표 포함, A4 세로, 1:1)
const fs = require('fs');
const { poly, sat } = require('./layout.cjs');
const R = 55, FLAT = 45, WHEEL_C = 50;        // 판 반지름, 아래판 평평한 면 위치, 바퀴 중심 x
const RS = 50;                                  // 센서 모듈 중심이 놓이는 반지름
const rect = (name, cx, cy, w, h, deg = 0) => ({ name, cx, cy, w, h, deg });
const sensorDeg = [-90, -45, 0, 45, 90];
const sensors = sensorDeg.map((d, i) => { const a = d * Math.PI / 180; return { i, d, x: RS * Math.sin(a), y: -RS * Math.cos(a) }; });
const upper = [
  ...sensors.map(s => rect(`ToF ${s.d}°`, s.x, s.y, 25, 4, s.d)),
  rect('브레드보드 A', 0, -18, 47, 35), rect('Nano', 0, -18, 45, 18), rect('AAA×3 홀더', 0, 22, 58, 37),
];
const lower = [rect('모터 L', -33, 0, 27, 12), rect('모터 R', 33, 0, 27, 12), rect('브레드보드 B', 0, 2, 35, 47), rect('TB6612', 0, -37, 20, 20), rect('5V 승압', 28, 26, 16, 25), rect('콘덴서', -26, 30, 8, 8), rect('캐스터', 0, 45, 10, 10)];
const holes = [[-32, -14], [32, -14], [-40, 24], [40, 24]];
const bad = [];
for (const [nm, set] of [['위판', upper], ['아래판', lower]]) for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) { if (set[i].name === '브레드보드 A' && set[j].name === 'Nano') continue; if (sat(poly(set[i]), poly(set[j]), 1)) bad.push(`${nm}: ${set[i].name}-${set[j].name}`); }
for (const [nm, set] of [['위판', upper], ['아래판', lower]]) for (const h of holes) for (const r of set) if (sat(poly(r), poly(rect('h', h[0], h[1], 7, 7)), 0)) bad.push(`${nm}: 구멍 ${h} - ${r.name}`);
console.log(bad.length ? '문제 ' + bad.join(' | ') : '겹침 없음');
// ---- SVG 도우미 ----
const T = (x, y, t, fs = 2.6, a = 'middle', w = 'normal', fill = '#111', extra = '') => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}" ${extra}>${t}</text>`;
const L = (x1, y1, x2, y2, c = '#111', w = .25, d = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${d ? `stroke-dasharray="${d}"` : ''}/>`;
const P = (pts, fill, stroke, w = .35, op = .3) => `<polygon points="${pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ')}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="${w}"/>`;
const arrow = (x, y, dx, dy) => { const a = Math.atan2(dy, dx), l = 1.6, w = .7; return `<polygon points="${x},${y} ${x - l * Math.cos(a) + w * Math.sin(a)},${y - l * Math.sin(a) - w * Math.cos(a)} ${x - l * Math.cos(a) - w * Math.sin(a)},${y - l * Math.sin(a) + w * Math.cos(a)}" fill="#c92a2a"/>`; };
const dimH = (x1, x2, y, txt, off = 0) => L(x1, y, x2, y, '#c92a2a', .3) + L(x1, y - 1.6, x1, y + 1.6, '#c92a2a', .3) + L(x2, y - 1.6, x2, y + 1.6, '#c92a2a', .3) + arrow(x1, y, 1, 0) + arrow(x2, y, -1, 0) + T((x1 + x2) / 2, y - 1.2 + off, txt, 2.5, 'middle', 'bold', '#c92a2a');
const dimV = (y1, y2, x, txt) => L(x, y1, x, y2, '#c92a2a', .3) + L(x - 1.6, y1, x + 1.6, y1, '#c92a2a', .3) + L(x - 1.6, y2, x + 1.6, y2, '#c92a2a', .3) + arrow(x, y1, 0, 1) + arrow(x, y2, 0, -1) + T(x - 1.8, (y1 + y2) / 2, txt, 2.5, 'end', 'bold', '#c92a2a');
const col = n => n.startsWith('ToF') ? '#2f9e5b' : n === 'Nano' ? '#2f6bff' : n.includes('홀더') ? '#e8a317' : n.includes('모터') ? '#6b7280' : n === 'TB6612' ? '#d6336c' : n.includes('승압') ? '#ef8a00' : '#868e96';
const plate = (parts, flat, extra) => {
  const S = 74; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * S}mm" height="${2 * S}mm" viewBox="${-S} ${-S} ${2 * S} ${2 * S}" font-family="inherit">`;
  s += L(-S, 0, S, 0, '#bbb', .2, '2 1') + L(0, -S, 0, S, '#bbb', .2, '2 1');
  s += flat ? `<path d="M ${FLAT},${-Math.sqrt(R * R - FLAT * FLAT).toFixed(2)} A ${R} ${R} 0 0 0 ${-FLAT},${-Math.sqrt(R * R - FLAT * FLAT).toFixed(2)} L ${-FLAT},${Math.sqrt(R * R - FLAT * FLAT).toFixed(2)} A ${R} ${R} 0 0 0 ${FLAT},${Math.sqrt(R * R - FLAT * FLAT).toFixed(2)} Z" fill="#f8fafc" stroke="#111" stroke-width=".5"/>` : `<circle r="${R}" fill="#f8fafc" stroke="#111" stroke-width=".5"/>`;
  for (const p of parts) s += P(poly(p), col(p.name), col(p.name)) + (p.name.startsWith('ToF') ? '' : T(p.cx, p.cy + 1 + (p.name === '브레드보드 A' ? 12 : 0), p.name, 2.3));
  for (const h of holes) s += `<circle cx="${h[0]}" cy="${h[1]}" r="1.6" fill="#fff" stroke="#c92a2a" stroke-width=".4"/>` + L(h[0] - 3, h[1], h[0] + 3, h[1], '#c92a2a', .2) + L(h[0], h[1] - 3, h[0], h[1] + 3, '#c92a2a', .2);
  return s + (extra || '') + '</svg>';
};
// 1쪽: 위판
let upperExtra = '';
for (const s of sensors) { const a = s.d * Math.PI / 180; upperExtra += L(0, 0, 62 * Math.sin(a), -62 * Math.cos(a), '#2f9e5b', .25, '1.5 1') + T(66 * Math.sin(a), -66 * Math.cos(a) + 1, `${s.d > 0 ? '+' : ''}${s.d}°`, 2.8, 'middle', 'bold', '#1b7a43'); }
upperExtra += `<circle r="${RS}" fill="none" stroke="#2f9e5b" stroke-width=".25" stroke-dasharray="1 1"/>` + T(-22, -RS - 3, `센서 중심 반지름 ${RS}`, 2.4, 'middle', 'normal', '#1b7a43');
upperExtra += dimH(-R, R, R + 6, `판 지름 Ø${2 * R}`);

const toTable = rows => `<table>${rows.map((r, i) => `<tr>${r.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const f = v => (Math.abs(v) < .005 ? 0 : v).toFixed(1);
const sensorTable = toTable([['센서', '방향(로봇 앞 기준)', 'x (mm)', 'y (mm)', 'Nano XSHUT'], ...sensors.map((s, i) => [`${i + 1}`, `${s.d > 0 ? '+' : ''}${s.d}°`, f(s.x), f(s.y), `D${i + 2}`])]);
const holeTable = toTable([['구멍', 'x (mm)', 'y (mm)', '지름'], ...holes.map((h, i) => [`${i + 1}`, f(h[0]), f(h[1]), 'Ø3.2'])]);
// 2쪽: 아래판
let lowerExtra = '';
lowerExtra += dimH(-FLAT, FLAT, R + 6, `평평한 면 사이 ${2 * FLAT}`);
lowerExtra += [-1, 1].map(sg => `<rect x="${sg > 0 ? 46 : -54}" y="-17" width="8" height="34" fill="#374151" fill-opacity=".2" stroke="#374151" stroke-width=".3" stroke-dasharray="1.5 1"/>` + T(sg * 50, -20, '바퀴', 2.4)).join('');
lowerExtra += L(-FLAT, 0, FLAT, 0, '#555', .2, '3 1') + T(-62, 3, '바퀴 축 y=0', 2.2, 'middle', 'normal', '#555');
lowerExtra += dimH(-WHEEL_C, WHEEL_C, -R - 6, `바퀴 중심 사이 ${2 * WHEEL_C} (= 시뮬레이션 바퀴 간격 100)`);
const lowerTable = toTable([['부품', '중심 x', '중심 y', '크기 (mm)'], ...lower.map(p => [p.name, f(p.cx), f(p.cy), `${p.w}×${p.h}`])]);
// 3쪽: 옆면도 (오른쪽이 앞)
const side = (() => {
  const W = 180, H = 100; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="-90 -92 ${W} ${H}" font-family="inherit">`;
  const Z = z => -z, bx = (x1, x2, z1, z2, c, t) => `<rect x="${x1}" y="${Z(z2)}" width="${x2 - x1}" height="${z2 - z1}" fill="${c}" fill-opacity=".3" stroke="${c}" stroke-width=".3"/>` + T((x1 + x2) / 2, Z((z1 + z2) / 2) + 1, t, 2.4);
  s += L(-90, 0, 90, 0, '#111', .5);
  s += `<circle cx="0" cy="${Z(17)}" r="17" fill="none" stroke="#374151" stroke-width=".4" stroke-dasharray="2 1"/>` + T(19, Z(17) + 1, '← 바퀴 축 높이 17', 2.4, 'start');
  s += `<circle cx="-45" cy="${Z(5)}" r="5" fill="#cbd5e1" stroke="#555" stroke-width=".4"/><rect x="-47" y="${Z(24)}" width="4" height="19" fill="#cbd5e1" stroke="#555" stroke-width=".3"/>` + T(-45, -9, '캐스터', 2.3);
  s += `<rect x="-55" y="${Z(24)}" width="110" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/><rect x="-55" y="${Z(56)}" width="110" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/>`;
  for (const x of [-24, 14]) s += `<rect x="${x - 1.6}" y="${Z(54)}" width="3.2" height="30" fill="#e5e7eb" stroke="#555" stroke-width=".3"/>`;
  s += bx(-6, 6, 12, 22, '#6b7280', '모터') + bx(-25.5, 21.5, 24, 32.5, '#6b7280', '브레드보드 B') + bx(-38.5, -13.5, 24, 32.5, '#ef8a00', '승압') + bx(-40.5, -3.5, 56, 71, '#e8a317', 'AAA×3') + bx(0.5, 35.5, 56, 64.5, '#6b7280', '브레드보드 A') + bx(2.5, 33.5, 64.5, 72, '#2f6bff', 'Nano');
  s += `<rect x="50" y="${Z(71)}" width="4" height="15" fill="#2f9e5b" fill-opacity=".4" stroke="#2f9e5b" stroke-width=".3"/>` + T(46, Z(62), '센서', 2.3, 'end') + L(54, Z(65), 78, Z(65), '#2f9e5b', .4, '1.5 1') + T(66, Z(66.5), '빔 높이 약 65', 2.4, 'middle', 'bold', '#1b7a43');
  s += dimV(Z(0), Z(24), 84, '24') + dimV(Z(24), Z(56), 78 + 12, '32');
  s += T(-88, -86, '옆면도 (오른쪽이 앞, 1:1)', 3.4, 'start', 'bold') + T(-88, Z(24) - 1, '아래판 윗면 z=24', 2.3, 'start') + T(-88, Z(56) - 1, '위판 윗면 z=56', 2.3, 'start');
  return s + '</svg>';
})();
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>몸체 제작도</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;color:#111}
.pg{width:210mm;height:297mm;padding:7mm 9mm;position:relative;page-break-after:always;overflow:hidden}h1{font-size:15pt;margin:0 0 1mm}h2{font-size:10.5pt;margin:2mm 0 1mm}p{font-size:8.5pt;margin:0 0 1.5mm;line-height:1.45}
table{border-collapse:collapse;font-size:8.5pt;margin:1mm 0}td,th{border:.25mm solid #555;padding:.6mm 2mm;text-align:center}th{background:#eee}.row{display:flex;gap:6mm;align-items:flex-start}svg{display:block}.warn{border:.4mm solid #e03131;background:#fff5f5;padding:1.5mm 3mm;font-size:8.5pt;margin-top:2mm}.ok{border:.4mm solid #e6a800;background:#fff9db;padding:1.5mm 3mm;font-size:8.5pt;margin-top:2mm}
</style></head><body>
<div class="pg"><h1>몸체 제작도 ① 위판 (센서 위치 포함, 1:1)</h1><p>인쇄: 100%, 쪽 맞춤 금지. 좌표는 판 중심이 (0, 0), 오른쪽이 +x, 앞쪽이 −y 입니다(단위 mm). 센서 방향은 로봇이 보는 방향 기준입니다.</p>
${plate(upper, false, upperExtra)}
<div class="row"><div><h2>센서 위치</h2>${sensorTable}</div><div><h2>스탠드오프 구멍 (위·아래판 공통)</h2>${holeTable}</div></div>
<div class="warn"><b>센서는 이 위치에서 정확해야 합니다.</b> 로봇은 시뮬레이션에서 −90°, −45°, 0°, +45°, +90° 다섯 방향의 거리를 보고 길을 배웠습니다. 센서가 이 방향에서 5° 넘게 어긋나면 배운 대로 움직이지 않을 수 있습니다. 센서 모듈은 판 위에 세워서(렌즈가 바깥을 향하게) 붙이고, 각 센서 렌즈의 앞면이 중심에서 약 52mm 떨어지게 하세요.</div></div>
<div class="pg"><h1>몸체 제작도 ② 아래판 (모터·바퀴 위치 포함, 1:1)</h1><p>옆면은 바퀴가 닿지 않게 x=±${FLAT}에서 평평하게 자릅니다. 모터는 판 아래에 브라켓으로 고정하고, 바퀴 축은 y=0 선 위에 둡니다.</p>
${plate(lower, true, lowerExtra)}
<div class="row"><div><h2>아래판 부품 위치</h2>${lowerTable}</div><div><h2>바퀴·모터</h2><table><tr><th>항목</th><th>값 (mm)</th></tr><tr><td>바퀴 지름</td><td>34</td></tr><tr><td>바퀴 중심 x</td><td>±${WHEEL_C}</td></tr><tr><td>바퀴 안쪽 면 x</td><td>±46</td></tr><tr><td>바퀴 축 높이</td><td>17</td></tr><tr><td>바퀴 간격(중심)</td><td>${2 * WHEEL_C}</td></tr></table></div></div></div>
<div class="pg"><h1>몸체 제작도 ③ 옆면도와 높이</h1>${side}
<h2>높이 표 (바닥 기준, mm)</h2><table><tr><th>항목</th><th>높이 z</th><th>비고</th></tr><tr><td>바퀴 축</td><td>17</td><td>바퀴 지름 34의 절반</td></tr><tr><td>아래판 윗면</td><td>24</td><td>모터가 판 아래 z 12~22</td></tr><tr><td>위판 윗면</td><td>56</td><td>스탠드오프 높이 30</td></tr><tr><td>센서 빔(렌즈 중심)</td><td>약 65</td><td>실측 필요</td></tr><tr><td>전체 높이</td><td>약 76</td><td>센서 윗면 기준</td></tr></table>
<div class="warn"><b>캐스터 높이:</b> 로봇이 기울면 센서 방향이 바뀝니다. 바퀴 2개와 캐스터가 바닥에 닿았을 때 아래판이 수평이어야 합니다(캐스터 윗면 높이 약 24). 높이가 안 맞으면 캐스터 아래에 얇은 판을 끼워 맞추세요.</div></div>
<div class="pg"><h1>몸체 제작도 ④ 센서 정렬과 로봇 프로그램 값</h1>
<h2>1. 시뮬레이션과 맞춰야 하는 값</h2>
<table><tr><th>항목</th><th>시뮬레이션 값</th><th>실제 로봇에서 맞추는 방법</th></tr>
<tr><td>로봇 반지름</td><td>55 mm (Ø110)</td><td>판 지름 Ø110</td></tr>
<tr><td>바퀴 간격</td><td>100 mm</td><td>바퀴 중심 x = ±50</td></tr>
<tr><td>센서 방향</td><td>−90°, −45°, 0°, +45°, +90°</td><td>위판 센서 위치 표대로</td></tr>
<tr><td>센서 거리의 기준점</td><td><b>로봇 중심</b>에서 벽까지</td><td><b>센서 값에 센서 앞면 반지름(약 52mm)을 더함</b></td></tr>
<tr><td>거리 최댓값</td><td>400 mm (넘으면 400)</td><td>400 이상이면 400으로 자름</td></tr>
<tr><td>센서 입력</td><td>거리 ÷ 400 (0~1)</td><td>(센서 값 + 52) ÷ 400 을 0~1로 자름</td></tr>
<tr><td>최고 속도</td><td>250 mm/s</td><td>바퀴 지름 34 → 약 140 rpm</td></tr></table>
<div class="ok"><b>왜 52mm를 더하나요?</b> 시뮬레이션의 센서 광선은 로봇 <b>중심</b>에서 쏩니다. 실제 센서는 판 가장자리 가까이(중심에서 약 52mm)에 있어서, 센서가 재는 거리가 중심 기준보다 52mm 짧게 나옵니다. 로봇이 배운 값과 같아지도록 센서 값에 52를 더해서 신경망에 넣어야 합니다. 이 값(52)은 렌즈 앞면이 중심에서 실제로 몇 mm 떨어졌는지 재서 바꾸세요.</div>
<h2>2. 센서 각도 맞추기 (인쇄해서 쓰는 방법)</h2><p>① 위판 도면(1쪽)을 인쇄해 판 위에 겹쳐 놓고, 센서 5개의 위치 선(초록 점선)에 맞춰 센서 뒷면 가운데를 붙입니다. ② 렌즈가 선 방향(바깥)을 향하는지 눈으로 확인합니다. ③ 붙인 뒤에는 아래 시험으로 오차를 확인합니다.</p>
<h2>3. 붙인 뒤 정확한지 확인하는 시험</h2>
<table><tr><th>시험</th><th>하는 방법</th><th>맞는 결과</th></tr>
<tr><td>앞 센서 거리</td><td>벽(또는 평평한 판)을 앞센서에 수직으로 대고 렌즈 앞면에서 벽까지 100mm</td><td>센서 값 100±10</td></tr>
<tr><td>좌우 센서 거리</td><td>로봇을 벽과 평행하게 두고 한쪽 벽을 옆 센서에서 100mm 거리에</td><td>해당 센서 값 100±10</td></tr>
<tr><td>대각선 센서</td><td>벽에 로봇을 45° 돌려서 향하게 하고 거리 확인</td><td>값 100±15</td></tr>
<tr><td>좌우 대칭</td><td>벽 한가운데 두고 양쪽 센서 값 비교</td><td>두 값 차이 10 이내</td></tr></table>
<h2>4. 부품을 재서 알려 주세요 (설계도 수정용)</h2>
<table><tr><th>항목</th><th>설계도 값</th><th>실측</th></tr><tr><td>센서 모듈 가로(귀 구멍 포함)</td><td>25</td><td></td></tr><tr><td>센서 모듈 세운 높이</td><td>13</td><td></td></tr><tr><td>센서 렌즈 중심 높이(보드 아래 끝에서)</td><td>약 7</td><td></td></tr><tr><td>센서 보드 두께 + 헤더 두께</td><td>4</td><td></td></tr><tr><td>모터 길이(축 제외)</td><td>27</td><td></td></tr><tr><td>모터 폭</td><td>12</td><td></td></tr><tr><td>TB6612 크기</td><td>20×20</td><td></td></tr><tr><td>브레드보드 크기</td><td>47×35</td><td></td></tr><tr><td>건전지 홀더 크기</td><td>58×37</td><td></td></tr></table></div>
</body></html>`;
fs.writeFileSync('body.html', html);
