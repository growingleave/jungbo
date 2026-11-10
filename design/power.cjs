const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const R = '#d9242f', K = '#111';
const wire = (pts, c, w = 1.2, d = '') => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" ${d ? `stroke-dasharray="${d}"` : ''}/>`;
const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c}"/>`;
s += T(8, 10, '전원 연결 (건전지 → 승압 모듈, 모터 드라이버)', 5, 'start', 'bold');
// 배터리 홀더
s += `<rect x="8" y="30" width="44" height="30" rx="2" fill="#fff3d6" stroke="#e8a317" stroke-width=".6"/>` + T(30, 38, 'AAA×3 홀더', 3.6, 'middle', 'bold');
s += T(30, 45, '(4.5V)', 3, 'middle');
s += wire([[52, 40], [70, 40]], R) + T(56, 38, '빨강 +', 2.8) + wire([[52, 54], [70, 54]], K) + T(56, 52, '검정 −', 2.8);
// 브레드보드 (전원 분배판)
s += `<rect x="70" y="22" width="96" height="72" rx="2" fill="#f8f9fa" stroke="#adb5bd" stroke-width=".6"/>` + T(118, 29, '작은 브레드보드 한 장 (전원 분배용)', 3.2, 'middle', 'bold');
// + 줄 A, + 줄 B, − 줄
const rows = [[40, '+ 줄 A', R], [60, '+ 줄 B', R], [80, '− 줄', K]];
rows.forEach(([y, n, c]) => { s += `<rect x="76" y="${y - 3.5}" width="38" height="7" rx="1.5" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width=".4"/>`; for (let i = 0; i < 5; i++) s += `<circle cx="${82 + i * 7}" cy="${y}" r="1.4" fill="#adb5bd"/>`; s += T(118, y + 1.2, n, 3.2, 'start', 'bold', c); });
// 배터리 선 꽂기
s += dot(82, 40, R) + dot(82, 80, K);
s += wire([[70, 40], [82, 40]], R) + wire([[70, 54], [74, 54], [74, 80], [82, 80]], K);
// 스위치(점퍼선)
s += wire([[89, 40], [89, 60]], '#2b8a3e', 1.4, '') + dot(89, 40, '#2b8a3e') + dot(89, 60, '#2b8a3e');
s += T(93, 50.5, '← 이 점퍼선이 스위치', 3, 'start', 'bold', '#2b8a3e');
s += T(93, 55, '꽂으면 켜짐 / 뽑으면 꺼짐', 2.8, 'start', 'normal', '#2b8a3e');
s += `<rect x="176" y="30" width="44" height="22" rx="2" fill="#ffe8cc" stroke="#ef8a00" stroke-width=".6"/>` + T(198, 38, '5V 승압 모듈', 3.4, 'middle', 'bold') + T(198, 44, 'IN+ (위)   IN− (아래)', 2.8, 'middle');
s += `<rect x="176" y="62" width="44" height="22" rx="2" fill="#ffdeeb" stroke="#c2255c" stroke-width=".6"/>` + T(198, 70, 'TB6612', 3.4, 'middle', 'bold') + T(198, 76, 'VM (위)   GND (아래)', 2.8, 'middle');
s += dot(96, 60, R) + dot(103, 60, R);
s += wire([[96, 60], [96, 66], [160, 66], [160, 38], [176, 38]], R) + T(122, 64.5, '→ 승압 IN+', 2.8);
s += wire([[103, 60], [103, 72], [176, 72]], R) + T(122, 70.5, '→ TB6612 VM', 2.8);
s += dot(96, 80, K) + dot(103, 80, K) + dot(110, 80, K);
s += wire([[96, 80], [96, 100], [170, 100], [170, 48], [176, 48]], K) + T(125, 98.5, '→ 승압 IN−', 2.8);
s += wire([[103, 80], [103, 107], [172, 107], [172, 80], [176, 80]], K) + T(125, 105.5, '→ TB6612 GND', 2.8);
s += wire([[110, 80], [110, 114]], K) + T(113, 117, '→ Nano GND', 2.8);
// 설명
s += `<rect x="8" y="124" width="212" height="52" rx="2" fill="#fff9db" stroke="#e6a800" stroke-width=".5"/>`;
const notes = ['쓰는 방법', '1. 배터리 빨강 선 끝(벗긴 곳)을 납으로 살짝 굳혀서 "+ 줄 A" 구멍에, 검정 선을 "− 줄" 구멍에 꽂습니다.', '2. 초록 점퍼선으로 "+ 줄 A"와 "+ 줄 B"를 이으면 전원이 켜집니다. 뽑으면 꺼집니다. (스위치 대신)', '3. "+ 줄 B"에서 승압 IN+와 TB6612 VM으로, "− 줄"에서 승압 IN−, TB6612 GND, Nano GND로 선을 냅니다.'];
notes.forEach((t, i) => { s += T(12, 132 + i * 8, t, i === 0 ? 3.8 : 3.1, 'start', i === 0 ? 'bold' : 'normal'); });
s += `<rect x="8" y="182" width="212" height="22" rx="2" fill="#fff5f5" stroke="#e03131" stroke-width=".5"/>` + T(12, 190, '주의: 빨강(+)과 검정(−)이 서로 닿으면 건전지가 뜨거워지고 위험합니다. 닿지 않게 하세요.', 3.2, 'start', 'bold', '#c92a2a') + T(12, 198, '연결하는 동안에는 초록 점퍼선(스위치)을 뽑아 두고, 모든 연결이 끝난 뒤에 꽂으세요.', 3.1);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="228mm" height="210mm" viewBox="0 0 228 210" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('power.html', html);
