// 브레드보드에 Nano를 꽂은 상태에서, 선 4개를 꽂을 구멍 위치 (초보용)
const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
// 브레드보드 (위에서 본 모양) : 세로 17줄, 가로 구멍 10칸(왼쪽 5, 오른쪽 5)
const bx = 30, by = 24, pitch = 5.2, rows = 17;
s += `<rect x="${bx}" y="${by}" width="${pitch * 11 + 6}" height="${pitch * rows + 6}" rx="2" fill="#f8f9fa" stroke="#adb5bd" stroke-width=".6"/>`;
const hx = c => bx + 4 + c * pitch + (c >= 5 ? pitch : 0);   // 열 c = 0..9
const hy = r => by + 5 + r * pitch;
for (let r = 0; r < rows; r++) for (let c = 0; c < 10; c++) s += `<rect x="${hx(c) - 1}" y="${hy(r) - 1}" width="2" height="2" fill="#ced4da"/>`;
// 가운데 홈
s += `<rect x="${hx(4) + 2.2}" y="${by + 2}" width="${pitch - 4.4}" height="${pitch * rows}" fill="#e9ecef"/>`;
// Nano: 왼쪽 핀 열 = c0? 오른쪽 핀 열 = c7 로 가정(사진처럼 오른쪽에 구멍 2칸 남음)
const nL = 0, nR = 7, top = 1;  // 위쪽 줄 번호
s += `<rect x="${hx(nL) - 2}" y="${hy(top) - 2}" width="${hx(nR) - hx(nL) + 4}" height="${pitch * 15 + 4}" rx="1.5" fill="#3b5bdb" fill-opacity=".28" stroke="#3b5bdb" stroke-width=".6"/>`;
s += T((hx(nL) + hx(nR)) / 2, hy(8), 'Nano', 4.5, 'middle', 'bold', '#1c3faa');
s += T((hx(nL) + hx(nR)) / 2, hy(9) + 1, '(위에서 본 모양)', 2.6, 'middle');
s += `<rect x="${(hx(nL) + hx(nR)) / 2 - 7}" y="${hy(top + 14) + 1}" width="14" height="9" rx="1" fill="#adb5bd" stroke="#495057" stroke-width=".4"/>` + T((hx(nL) + hx(nR)) / 2, hy(top + 14) + 7.5, 'USB', 2.6, 'middle');
const right = ['VIN', 'GND', 'RST', '5V', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'AREF', '3V3', 'D13'];
const col = { '5V': '#d9242f', 'GND': '#111', 'A5': '#e6a800', 'A4': '#ef6c00' };
right.forEach((n, i) => { const y = hy(top + i); const c = col[n]; s += `<circle cx="${hx(nR)}" cy="${y}" r="1.6" fill="${c || '#868e96'}"/>`; s += T(hx(nR) - 3, y + 1, n, 2.7, 'end', c ? 'bold' : 'normal', c ? '#111' : '#868e96'); });
// 선을 꽂을 구멍: 핀의 오른쪽 바로 옆 구멍(열 8)
const use = [['5V', '선 ①  → 센서 VIN', '#d9242f'], ['GND', '선 ②  → 센서 GND', '#111'], ['A4', '선 ③  → 센서 SDA', '#ef6c00'], ['A5', '선 ④  → 센서 SCL', '#e6a800']];
use.forEach(([n, label, c]) => { const i = right.indexOf(n), y = hy(top + i); s += `<circle cx="${hx(8)}" cy="${y}" r="2.6" fill="none" stroke="${c}" stroke-width=".9"/><line x1="${hx(8) + 2.6}" y1="${y}" x2="${bx + pitch * 11 + 20}" y2="${y}" stroke="${c}" stroke-width="1.1"/>`; s += T(bx + pitch * 11 + 22, y + 1.2, label, 3.4, 'start', 'bold'); });
s += T(bx + pitch * 11 + 22, hy(top + 2) + 14, '(동그라미 친 구멍에 선의 금속 핀을 꽂습니다)', 2.8, 'start');
// 설명
s += T(8, 10, '선을 꽂는 구멍: Nano 핀의 "바로 오른쪽 같은 줄"', 5, 'start', 'bold');
s += T(8, 16.5, '하얀 판의 같은 줄(가로로 이어진 5칸)은 안에서 서로 연결되어 있습니다.', 3.2);
s += `<rect x="6" y="${by + pitch * rows + 14}" width="200" height="34" rx="2" fill="#fff5f5" stroke="#e03131" stroke-width=".5"/>`;
s += T(10, by + pitch * rows + 21, '틀리기 쉬운 것', 3.6, 'start', 'bold', '#c92a2a');
s += T(10, by + pitch * rows + 27, '· 핀 이름 바로 오른쪽 같은 줄이어야 합니다. 위나 아래 줄에 꽂으면 연결되지 않습니다.', 3);
s += T(10, by + pitch * rows + 33, '· Nano의 "VIN"이 아니라 "5V" 줄에 꽂습니다(두 줄이 가깝습니다).', 3);
s += T(10, by + pitch * rows + 39, '· 선을 꽂을 때 금속 핀이 구멍 끝까지 들어가게 눌러서 꽂습니다.', 3);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="212mm" height="168mm" viewBox="0 0 212 168" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('where.html', html);
