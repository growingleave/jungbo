const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const R = '#d9242f', K = '#111';
const wire = (pts, c, w = 1.2) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${c}"/>`;
s += T(8, 10, 'USB 선 없이 Nano에 전원 주기', 5.5, 'start', 'bold');
s += T(8, 17, '승압 모듈이 내보내는 5V를 전선 2개로 Nano 5V, GND에 바로 연결합니다.', 3.2);
// 승압 모듈
s += `<rect x="12" y="32" width="64" height="40" rx="2" fill="#ffe8cc" stroke="#ef8a00" stroke-width=".6"/>` + T(44, 40, '5V 승압 모듈', 3.8, 'middle', 'bold');
s += `<rect x="14" y="46" width="22" height="14" rx="1" fill="#e9ecef" stroke="#868e96" stroke-width=".4"/>` + T(25, 55, 'USB 구멍', 2.8, 'middle') + T(25, 64, '(쓰지 않음)', 2.6, 'middle', 'normal', '#868e96');
s += T(46, 50, '출력 (OUT)', 3, 'start', 'bold') + T(46, 58, 'OUT+ 5V  ●', 3.2, 'start', 'bold', R) + T(46, 66, 'OUT−  GND ●', 3.2, 'start', 'bold', K);
s += dot(72, 57, R) + dot(72, 65, K);
s += T(12, 78, '입력 IN+, IN− 에는 건전지(+, −)가 연결됩니다', 2.8, 'start', 'normal', '#555');
// Nano
s += `<rect x="130" y="28" width="62" height="60" rx="2" fill="#dbe4ff" stroke="#3b5bdb" stroke-width=".6"/>` + T(161, 36, 'Arduino Nano', 3.8, 'middle', 'bold');
[['+5V', 50, R], ['GND', 66, K]].forEach(([n, y, c]) => { s += dot(130, y, c) + T(134, y + 1.2, n + ' 핀', 3.4, 'start', 'bold'); });
s += wire([[72, 57], [100, 57], [100, 50], [130, 50]], R, 1.4) + wire([[72, 65], [110, 65], [110, 66], [130, 66]], K, 1.4);
s += `<rect x="152" y="74" width="30" height="10" rx="1" fill="#adb5bd" stroke="#495057" stroke-width=".4"/>` + T(167, 80.5, 'mini USB 구멍', 2.6, 'middle');
s += T(161, 93, '(프로그램 올릴 때만 사용)', 2.8, 'middle', 'normal', '#1971c2');
// 설명
s += `<rect x="8" y="104" width="196" height="64" rx="2" fill="#fff9db" stroke="#e6a800" stroke-width=".5"/>`;
['바뀌는 것', '· 파란 USB 선(승압 모듈 ↔ Nano)을 **없앱니다.** 빨강(5V)과 검정(GND) 전선 2개로 대신합니다.', '· Nano의 mini USB 구멍은 **프로그램을 올릴 때만** 컴퓨터 USB 선을 꽂아 씁니다. 평소에는 비어 있습니다.', '· 건전지 전원(스위치로 쓰는 점퍼선)을 **뽑은 상태에서만** 컴퓨터 USB를 꽂으세요. 전원 두 개가 동시에 들어가는 것을 막습니다.', '· 이 연결이 Nano에 전기를 주는 유일한 길입니다. 전선이 헐거우면 로봇이 꺼지니 땜하거나 단단히 고정하세요.'].forEach((t, i) => { s += T(12, 112 + i * 9, t.replace(/\*\*/g, ''), i === 0 ? 3.8 : 3.1, 'start', i === 0 ? 'bold' : 'normal'); });
s += `<rect x="8" y="174" width="196" height="30" rx="2" fill="#fff5f5" stroke="#e03131" stroke-width=".5"/>`;
s += T(12, 182, '승압 모듈에 OUT+ / OUT− 패드가 없는 경우', 3.6, 'start', 'bold', '#c92a2a');
s += T(12, 190, 'USB 구멍 안쪽의 +5V 핀과 GND 핀(보통 양 끝의 핀)에 전선을 땜합니다. 모듈 사진을 보내 주시면 어디가 5V이고 GND인지 읽어 드립니다.', 3.1);
s += T(12, 197, '※ 5V 핀을 거꾸로 연결하면 Nano가 망가집니다. 땜하기 전에 +와 −를 꼭 확인하세요.', 3.1, 'start', 'bold', '#c92a2a');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="212mm" height="210mm" viewBox="0 0 212 210" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('nousb.html', html);
