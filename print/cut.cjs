// 종이 인쇄 → 판지에 붙여 자르는 1:1 도안 (A4 3쪽)
const fs = require('fs');
const P = JSON.parse(fs.readFileSync(__dirname + '/params.json', 'utf8'));
const R = P.plate.radius, FLAT = P.plate.flatX;
const T = (x, y, t, fs = 3, a = 'middle', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const L = (x1, y1, x2, y2, c = '#111', w = .4, d = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${d ? `stroke-dasharray="${d}"` : ''}/>`;
const hole = (x, y, r = 1.7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#c92a2a" stroke-width=".4"/>` + L(x - 3, y, x + 3, y, '#c92a2a', .2) + L(x, y - 3, x, y + 3, '#c92a2a', .2);
const slotR = (cx, cy, w, h) => `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="#fff" stroke="#c92a2a" stroke-width=".4"/>`;
const box = (cx, cy, w, h, deg, c, label) => `<g transform="translate(${cx},${cy}) rotate(${deg})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width=".25" stroke-dasharray="1.5 1"/>${label ? `<text x="0" y="1" font-size="2.6" text-anchor="middle" fill="${c}">${label}</text>` : ''}</g>`;
const header = (title, sub) => T(8, 12, title, 6, 'start', 'bold') + T(8, 18.5, sub, 3, 'start');
const scaleBar = (x, y) => L(x, y, x + 100, y, '#111', .5) + [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => L(x + v, y - 2, x + v, y + 2, '#111', .3)).join('') + T(x + 50, y + 7, '이 선의 길이가 정확히 100mm(자로 재서 확인)이면 100%로 올바르게 인쇄된 것입니다', 2.8);
const sensorDeg = P.sensor.angles;
// ---- 1쪽: 위판 ----
let p1 = header('① 위판 도안 (Ø110)', '굵은 검은 선 = 자르는 선   빨간 십자 원 = 구멍(지름 3.4)   빨간 둥근 사각 = 지퍼타이 홈   점선 = 위치 표시(자르지 않음)');
p1 += `<g transform="translate(105,100)">`;
p1 += L(-62, 0, 62, 0, '#bbb', .2, '2 1') + L(0, -62, 0, 62, '#bbb', .2, '2 1');
p1 += `<circle r="${R}" fill="#fff" stroke="#111" stroke-width=".6"/>`;
for (const [x, y] of P.plate.standoffHoles) p1 += hole(x, y);
p1 += slotR(-P.battery.zipSlotX, P.battery.zipSlotY, 1.8, 6) + slotR(P.battery.zipSlotX, P.battery.zipSlotY, 1.8, 6);
for (const d of sensorDeg) {
  const a = d * Math.PI / 180, rad = [Math.sin(a), -Math.cos(a)], tan = [Math.cos(a), Math.sin(a)], rb = P.sensor.frontRadius - P.sensor.boardThickness;
  const pt = (r, u) => [rad[0] * r + tan[0] * u, rad[1] * r + tan[1] * u], hw = P.sensor.boardWidth / 2;
  p1 += L(0, 0, ...pt(61, 0), '#2f9e5b', .25, '1.5 1');
  const q = [pt(rb - 7, -hw), pt(rb - 7, hw), pt(rb, hw), pt(rb, -hw)];
  p1 += `<polygon points="${q.map(v => v.join(',')).join(' ')}" fill="#2f9e5b" fill-opacity=".12" stroke="#2f9e5b" stroke-width=".3"/>`;
  p1 += L(...pt(rb, -hw - 1), ...pt(rb, hw + 1), '#2f9e5b', .7) + L(...pt(P.sensor.frontRadius, -hw), ...pt(P.sensor.frontRadius, hw), '#2f9e5b', .25, '1 1');
  p1 += T(...pt(66, 0), `${d > 0 ? '+' : ''}${d}°`, 3, 'middle', 'bold', '#1b7a43');
}
p1 += box(0, -18, 47, 35, 0, '#777', '브레드보드 A(+Nano)') + box(0, 22, 58, 37, 0, '#c78a00', '배터리 홀더');
p1 += `</g>`;
p1 += T(105, 178, '초록 칸 = 센서용 판지 받침을 붙일 자리 (굵은 초록 선이 접히는 선 = 받침 앞쪽 기준선)', 3, 'middle', 'bold', '#1b7a43');
p1 += T(105, 183, '초록 점선(굵은 선 바깥) = 센서 보드 앞면(렌즈 면)이 오는 위치. 중심에서 52mm', 3, 'middle', 'normal', '#1b7a43');
p1 += `<g transform="translate(0,200)">${scaleBar(55, 0)}</g>`;
p1 += T(8, 222, '만드는 순서', 4, 'start', 'bold');
['1. 100%로 인쇄(쪽 맞춤 금지)하고, 위의 100mm 선이 정확한지 자로 확인합니다.', '2. 도안을 판지(두께 2~3mm)에 풀(스프레이풀이나 딱풀)로 붙입니다.', '3. 굵은 검은 원을 칼로 자릅니다. 칼을 세워서 여러 번 나눠 그으면 깔끔합니다.', '4. 빨간 구멍은 송곳이나 지름 3.4mm 펀치로 뚫고, 빨간 홈은 칼로 가늡니다.', '5. 도안 종이는 붙인 채로 두고 쓰거나, 선 위치를 연필로 표시한 뒤 떼도 됩니다.'].forEach((t, i) => { p1 += T(8, 229 + i * 6, t, 3.3, 'start'); });
// ---- 2쪽: 아래판 ----
const yc = Math.sqrt(R * R - FLAT * FLAT);
let p2 = header('② 아래판 도안 (옆면 평평)', '자르는 선은 굵은 검은 선입니다. 모터는 판 아래에 지퍼타이로 달고, 나머지 부품은 양면테이프로 붙입니다.');
p2 += `<g transform="translate(105,100)">`;
p2 += L(-62, 0, 62, 0, '#bbb', .2, '2 1') + L(0, -62, 0, 62, '#bbb', .2, '2 1');
p2 += `<path d="M ${FLAT},${-yc} A ${R} ${R} 0 0 0 ${-FLAT},${-yc} L ${-FLAT},${yc} A ${R} ${R} 0 0 0 ${FLAT},${yc} Z" fill="#fff" stroke="#111" stroke-width=".6"/>`;
for (const [x, y] of P.plate.standoffHoles) p2 += hole(x, y);
for (const sx of [-1, 1]) for (const dx of [-1, 1]) for (const sy of [-1, 1]) p2 += slotR(sx * P.motor.centerX + dx * P.motor.zipSlotDX, sy * P.motor.zipSlotDY, 5, 1.8);
p2 += slotR(0, P.caster.centerY - 4.5, 12, 1.8) + slotR(0, P.caster.centerY + 4.5, 12, 1.8);
for (const sg of [-1, 1]) p2 += box(sg * P.motor.centerX, 0, P.motor.length, P.motor.bodyWidth, 0, '#495057', '모터(판 아래)') + `<rect x="${sg > 0 ? 47 : -55}" y="-17" width="8" height="34" fill="none" stroke="#374151" stroke-width=".3" stroke-dasharray="1.5 1"/>`;
p2 += box(0, 2, 35, 47, 0, '#777', '브레드보드 B') + box(0, -37, 20, 20, 0, '#d6336c', 'TB6612') + box(28, 26, 16, 25, 0, '#ef8a00', '승압') + box(0, P.caster.centerY, 10, 10, 0, '#555', '캐스터');
p2 += L(-FLAT, -70, FLAT, -70, '#c92a2a', .3) + T(0, -72, `평평한 면 사이 ${2 * FLAT}mm`, 2.8, 'middle', 'bold', '#c92a2a');
p2 += `</g>`;
p2 += `<g transform="translate(0,200)">${scaleBar(55, 0)}</g>`;
p2 += T(8, 222, '붙이는 위치와 주의', 4, 'start', 'bold');
['· 점선 상자는 그 부품의 위치입니다. 모터는 판 아래쪽에 달고, 지퍼타이는 두 홈에 통과시켜 모터를 감습니다.', '· 바퀴 점선(양옆)은 바퀴가 올 자리입니다. 판 옆면(평평한 선)이 바퀴에 닿지 않아야 합니다.', '· 모터 축은 가운데 가로 점선(y=0) 위에 오도록 달아야 로봇이 곧게 갑니다.', '· 캐스터(뒤 바퀴)는 두 홈에 지퍼타이로 고정하고, 판이 수평인지 확인합니다.'].forEach((t, i) => { p2 += T(8, 229 + i * 6, t, 3.3, 'start'); });
// ---- 3쪽: 센서 받침 + 기둥 ----
let p3 = header('③ 센서 받침 (판지 ×5)와 기둥', '굵은 검은 선 = 자름, 파란 점선 = 접는 선. 얇은 판지(0.5~1mm: 책 표지나 포장 상자)로 만듭니다.');
const bw = P.sensor.boardWidth + 2;
for (let k = 0; k < 5; k++) {
  const ox = 10 + (k % 3) * 66, oy = 28 + Math.floor(k / 3) * 70;
  p3 += `<g transform="translate(${ox},${oy})">`;
  p3 += `<rect x="0" y="0" width="${bw}" height="7" fill="#fff" stroke="#111" stroke-width=".5"/><rect x="0" y="7" width="${bw}" height="18" fill="#fff" stroke="#111" stroke-width=".5"/>`;
  p3 += L(0, 7, bw, 7, '#1971c2', .5, '2 1.2') + T(bw / 2, 5, '바닥 (판에 붙임)', 2.6) + T(bw / 2, 15, '세우는 면', 2.8) + T(bw / 2, 19, '(센서 뒷면 붙임)', 2.6);
  p3 += T(bw / 2, 31, `센서 ${k + 1} (${sensorDeg[k] > 0 ? '+' : ''}${sensorDeg[k]}°)`, 3, 'middle', 'bold');
  p3 += `</g>`;
}
p3 += T(8, 172, '받침 사용법', 4, 'start', 'bold');
['1. 5장을 잘라 파란 점선에서 직각(L자)으로 접습니다. 크기는 가로 27mm, 바닥 7mm, 세우는 면 18mm입니다.', '2. 바닥 쪽을 1쪽 도안의 초록 칸에 풀로 붙입니다. 접힌 선이 굵은 초록 선(센서 기준선)과 일치해야 합니다.', '3. 센서 보드를 세우는 면 앞쪽에 양면테이프로 붙입니다. 렌즈가 바깥을 향하고 핀 줄이 위로 가게 합니다.', '4. 판지가 얇으면 세우는 면 뒤에 작은 삼각 판지를 대어 기울지 않게 합니다.'].forEach((t, i) => { p3 += T(8, 178 + i * 6, t, 3.3, 'start'); });
p3 += T(8, 208, '기둥 4개 (위판과 아래판 사이, 높이 30mm)', 4, 'start', 'bold');
['판지 기둥이 없으면 볼펜 대나 빨대를 30mm로 잘라 쓰세요. 네 개의 길이를 똑같이 맞추는 것이 중요합니다(판이 수평이 됩니다).', '아래판 구멍과 위판 구멍 위에 기둥을 세우고, 구멍 위치마다 풀 또는 뜨거운 글루건으로 고정합니다.', '판 두께가 2mm보다 두꺼우면(예: 3mm) 그만큼 기둥을 조금 더 길게(31mm) 해도 됩니다.'].forEach((t, i) => { p3 += T(8, 215 + i * 6, t, 3.3, 'start'); });
const page = body => `<div class="pg"><svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" font-family="inherit">${body}</svg></div>`;
fs.writeFileSync('cut.html', `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}.pg{width:210mm;height:297mm;page-break-after:always;overflow:hidden}</style></head><body>${page(p1)}${page(p2)}${page(p3)}</body></html>`);
