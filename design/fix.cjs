// 두 번째 사진과 같은 방향(USB가 위)에서, 선이 꽂혀야 할 줄과 센서 핀 배치
const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const C = { red: '#d9242f', brown: '#7b4a2b', orange: '#ef6c00', yellow: '#e6a800', purple: '#7048e8' };
// 왼쪽: Nano (USB 위), 왼쪽 핀 줄
const nx = 78, ny = 26, nw = 40, nh = 150;
s += T(8, 12, '선이 꽂히는 줄 (사진과 같은 방향: USB가 위)', 5, 'start', 'bold');
s += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="2" fill="#dbe4ff" stroke="#3b5bdb" stroke-width=".7"/>`;
s += `<rect x="${nx + 10}" y="${ny - 8}" width="20" height="10" rx="1" fill="#adb5bd" stroke="#495057" stroke-width=".4"/>` + T(nx + 20, ny - 1, 'USB', 2.6, 'middle');
s += T(nx + nw / 2 + 6, ny + 70, 'Nano', 4.5, 'middle', 'bold', '#1c3faa');
const left = ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '+5V', 'RST', 'GND', 'VIN'];
const py = i => ny + 8 + i * 9.4;
const use = { 'A4': [C.yellow, '노랑 선  ←→  센서 SDA'], 'A5': [C.orange, '주황 선  ←→  센서 SCL'], '+5V': [C.red, '빨강 선  ←→  센서 VIN'], 'GND': [C.brown, '갈색 선  ←→  센서 GND'] };
left.forEach((n, i) => { const y = py(i), u = use[n]; s += `<circle cx="${nx}" cy="${y}" r="1.5" fill="${u ? u[0] : '#868e96'}"/>`; s += T(nx + 4, y + 1.1, n + (n === 'A4' ? ' (SDA)' : n === 'A5' ? ' (SCL)' : ''), 3, 'start', u ? 'bold' : 'normal', u ? '#111' : '#868e96'); if (u) { s += `<line x1="${nx - 1.5}" y1="${y}" x2="${nx - 14}" y2="${y}" stroke="${u[0]}" stroke-width="1.4"/><circle cx="${nx - 5}" cy="${y}" r="2.4" fill="none" stroke="${u[0]}" stroke-width=".8"/>` + T(nx - 16, y + 1.2, u[1], 3.2, 'end', 'bold'); } });
// 틀리기 쉬운 줄 강조
s += `<rect x="${nx - 1}" y="${py(13) - 4}" width="${nw + 2}" height="9" fill="none" stroke="#c92a2a" stroke-width=".6" stroke-dasharray="2 1"/>` + T(nx + nw + 4, py(13) + 1.2, '← GND (VIN 아님)', 2.9, 'start', 'bold', '#c92a2a');
s += `<rect x="${nx - 1}" y="${py(7) - 4}" width="${nw + 2}" height="9" fill="none" stroke="#c92a2a" stroke-width=".6" stroke-dasharray="2 1"/>` + T(nx + nw + 4, py(7) + 1.2, '← A4 (A3 아님)', 2.9, 'start', 'bold', '#c92a2a');
// 오른쪽: 센서
const sx = 160, sy = 70;
s += `<rect x="${sx}" y="${sy}" width="70" height="40" rx="3" fill="#e5dbff" stroke="#7048e8" stroke-width=".7"/>`;
s += T(sx + 35, sy + 37, 'VL53L0X 센서 (위에서 봄, 핀이 위쪽)', 3, 'middle', 'bold');
const pins = [['XSHUT', C.purple], ['GPIO1', null], ['SDA', C.yellow], ['SCL', C.orange], ['GND', C.brown], ['VIN', C.red]];
pins.forEach(([n, c], i) => { const x = sx + 8 + i * 10.5; s += `<rect x="${x - .8}" y="${sy - 7}" width="1.6" height="7" fill="#555"/>`; s += T(x, sy + 7, n, 2.7, 'middle', 'bold'); if (c) s += `<rect x="${x - 3.6}" y="${sy - 22}" width="7.2" height="13" rx="1" fill="#212529"/><line x1="${x}" y1="${sy - 22}" x2="${x}" y2="${sy - 32}" stroke="${c}" stroke-width="1.6"/>`; else s += T(x, sy - 12, '비움', 2.6, 'middle', 'normal', '#868e96'); });
s += T(sx - 4, sy - 40, '센서 핀: 선 끝의 까만 커넥터를 핀 위에 끝까지 눌러 끼웁니다', 3.2, 'start', 'bold');
s += T(sx - 4, sy - 35.5, '(끼운 뒤에는 금속 핀이 커넥터 안으로 들어가서 보이지 않아야 합니다)', 2.8);
s += T(sx + 35, sy + 50, '보라 선(XSHUT)은 Nano의 +5V 줄에 연결', 2.9, 'middle', 'normal', C.purple);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="250mm" height="190mm" viewBox="0 0 250 190" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('fix.html', html);
