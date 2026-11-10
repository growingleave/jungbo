// 센서 1개 시험 연결도 (A4 가로)
const fs = require('fs');
const RED = '#d9242f', BLK = '#111', YEL = '#e6a800', ORG = '#ef6c00';
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const wire = (pts, c, w = 1.1, dash = '') => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const dot = (x, y, c = '#111', r = 1.3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff" stroke="#c92a2a" stroke-width=".6"/>` + T(x, y + 1.3, n, 3.8, 'middle', 'bold', '#c92a2a');
// Nano (USB가 아래)
const nx = 60, ny = 18, nw = 40, nh = 112;
s += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="2" fill="#dbe4ff" stroke="#3b5bdb" stroke-width=".7"/>`;
s += T(nx + nw / 2, ny + 8, 'Arduino Nano', 4, 'middle', 'bold') + T(nx + nw / 2, ny + 13, '(위에서 본 모양, USB가 아래)', 2.6, 'middle');
s += `<rect x="${nx + 12}" y="${ny + nh - 2}" width="16" height="12" rx="1" fill="#adb5bd" stroke="#495057" stroke-width=".5"/>` + T(nx + 20, ny + nh + 5, 'USB', 2.8, 'middle');
const right = ['VIN', 'GND', 'RST', '5V', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'AREF', '3V3', 'D13'];
const py = i => ny + 18 + i * 6.3;
const use = { '5V': RED, 'A5': YEL, 'A4': ORG, 'GND': BLK };
right.forEach((n, i) => { const c = use[n]; const y = py(i); s += `<circle cx="${nx + nw}" cy="${y}" r="1.2" fill="${c || '#868e96'}"/>` + T(nx + nw - 3, y + 1.1, n + (n === 'A4' ? ' (SDA)' : n === 'A5' ? ' (SCL)' : ''), 3, 'end', c ? 'bold' : 'normal', c ? '#111' : '#868e96'); });
// 센서 (보드 위에서 본 모양, 핀 6개 세로)
const sx = 180, sy = 30, sw = 38, sh = 66;
s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="2" fill="#e5dbff" stroke="#7048e8" stroke-width=".7"/>`;
s += T(sx + sw / 2, sy + 7, 'VL53L0X 센서', 3.8, 'middle', 'bold') + T(sx + sw / 2, sy + 12, '(핀 쪽을 왼쪽으로)', 2.6, 'middle');
const sp = [['VIN', RED], ['GND', BLK], ['SCL', YEL], ['SDA', ORG], ['GPIO1', null], ['XSHUT', null]];
const spy = i => sy + 20 + i * 8;
sp.forEach(([n, c], i) => { const y = spy(i); s += `<rect x="${sx - 3}" y="${y - .8}" width="3" height="1.6" fill="#555"/>` + T(sx + 3, y + 1.2, n, 3.2, 'start', c ? 'bold' : 'normal', c ? '#111' : '#868e96'); });
s += `<circle cx="${sx + 30}" cy="${sy + 40}" r="3" fill="#212529"/>` + T(sx + 30, sy + 48, '렌즈', 2.6, 'middle');
// 연결선
const w1 = [['5V', 'VIN', RED, 0], ['A5', 'SCL', YEL, 2], ['A4', 'SDA', ORG, 3], ['GND', 'GND', BLK, 1]];
w1.forEach(([nn, sn, c, si], k) => { const ni = right.indexOf(nn); const x1 = nx + nw, y1 = py(ni), x2 = sx - 3, y2 = spy(si); const mx = 124 + k * 9; s += wire([[x1, y1], [mx, y1], [mx, y2], [x2, y2]], c) + dot(x1, y1, c) + dot(x2, y2, c); });
s += T(sx - 20, spy(4) + 1.2, '연결 안 함', 3, 'end', 'normal', '#868e96') + T(sx - 20, spy(5) + 1.2, '연결 안 함', 3, 'end', 'normal', '#868e96');
// 번호
s += num(112, py(3) - 3.5, '①') + num(112, py(1) - 3.5, '②') + num(112, py(7) + 4.2, '③') + num(112, py(6) - 4.5, '④');
// 컴퓨터
s += `<rect x="6" y="104" width="38" height="22" rx="2" fill="#f1f3f5" stroke="#868e96" stroke-width=".6"/>` + T(25, 113, '컴퓨터', 3.6, 'middle', 'bold') + T(25, 119, 'Arduino IDE', 2.8, 'middle');
s += wire([[44, 115], [52, 115], [52, 142], [nx + 20, 142], [nx + 20, ny + nh + 12]], '#495057', 1.4) + T(52, 146, 'USB 케이블', 2.8, 'start');
// 설명 박스
s += `<rect x="6" y="152" width="285" height="52" rx="2" fill="#f8f9fa" stroke="#adb5bd" stroke-width=".4"/>`;
s += T(10, 160, '순서: ① Nano 5V → 센서 VIN   ② Nano GND → 센서 GND   ③ Nano A4 → 센서 SDA   ④ Nano A5 → 센서 SCL   (센서 GPIO1, XSHUT은 연결하지 않음)', 3.1, 'start', 'bold');
const notes = ['· 연결하기 전에 USB를 뽑아 둡니다. 선을 다 연결한 뒤에 USB를 꽂습니다.', '· SDA와 SCL을 바꿔 꽂기 쉽습니다. 센서 핀 순서는 VIN, GND, SCL, SDA 입니다(GND 다음이 SCL).', '· VIN은 Nano 위쪽의 "VIN" 핀이 아니라 "5V" 핀에 연결합니다(두 핀이 가깝게 있습니다).', '· 판매 페이지에 센서 VIN 입력이 3.3V만 가능하다고 되어 있으면 5V 대신 Nano의 3V3 핀에 연결합니다.', '· 연결한 뒤 I2C 스캐너 코드를 올리고 시리얼 모니터(9600)에서 0x29가 나오는지 확인합니다.'];
notes.forEach((t, i) => { s += T(10, 168 + i * 6.5, t, 3); });
const html = `<!doctype html><html><head><meta charset="utf-8"><title>센서 시험 연결도</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}.t{position:absolute;left:8mm;top:3mm;font-size:13pt;font-weight:bold}</style></head><body><div class="t">센서 1개 시험 연결도 — 점퍼선 4개</div><svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210" style="position:absolute;left:0;top:0;font-family:inherit">${s}</svg></body></html>`;
fs.writeFileSync('sensor_test.html', html);
