// 모터 배선도 (A4 가로, 단위 mm)
const fs = require('fs');
const RED = '#d9242f', BLK = '#111', ORG = '#ef8a00', PUR = '#7048e8', GRN = '#2b8a3e', BLU = '#1971c2';
let s = '';
const T = (x, y, t, fs = 3.2, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const box = (x, y, w, h, fill, stroke, title, ts = 3.8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>` + T(x + w / 2, y + 5.5, title, ts, 'middle', 'bold');
const wire = (pts, c, w = .9, dash = '') => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const dot = (x, y, c = '#111') => `<circle cx="${x}" cy="${y}" r="1.1" fill="${c}"/>`;
const num = (x, y, n) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" stroke="#c92a2a" stroke-width=".6"/>` + T(x, y + 1.3, n, 3.6, 'middle', 'bold', '#c92a2a');

// 배터리 + 스위치 + 승압
s += box(6, 24, 36, 30, '#fff3d6', '#e8a317', 'AAA×3 홀더 (4.5V)');
s += T(10, 40, '+', 5, 'start', 'bold', RED) + T(10, 50, '−', 5, 'start', 'bold', BLK);
s += box(46, 26, 20, 16, '#f1f3f5', '#868e96', '', 3) + T(56, 32, '분리', 2.8, 'middle', 'bold') + T(56, 36, '점퍼', 2.8, 'middle', 'bold') + T(56, 40, '(뽑으면 OFF)', 2.2, 'middle');
s += box(70, 20, 36, 26, '#ffe8cc', '#ef8a00', '5V 승압 모듈', 3.4);
s += T(88, 29, '(USB 단자형)', 2.6, 'middle');
s += T(71.5, 36.5, 'IN+', 2.6) + T(82, 44.5, 'IN−', 2.6) + T(104, 26, 'USB', 2.6, 'end');
// Nano
s += box(112, 20, 40, 112, '#dbe4ff', '#3b5bdb', 'Arduino Nano');
s += T(132, 33, '(USB 단자가 위)', 2.6, 'middle');
const nano = [['5V', 62, RED], ['GND', 74, BLK], ['D7', 82, ORG], ['D8', 90, ORG], ['D9', 98, PUR], ['D12', 106, ORG], ['D13', 114, ORG], ['D10', 122, PUR]];
for (const [n, y, c] of nano) s += T(150, y + 1, n, 3.2, 'end', 'bold') + dot(152, y, c);
// TB6612
s += box(180, 40, 42, 92, '#ffdeeb', '#c2255c', 'TB6612 드라이버');
const tb = [['VM', 50, RED], ['VCC', 58, RED], ['STBY', 66, RED], ['GND', 74, BLK], ['AIN1', 82, ORG], ['AIN2', 90, ORG], ['PWMA', 98, PUR], ['BIN1', 106, ORG], ['BIN2', 114, ORG], ['PWMB', 122, PUR]];
for (const [n, y, c] of tb) s += T(183, y + 1, n, 3.2, 'start', 'bold') + dot(180, y, c);
const out = [['AO1', 60], ['AO2', 68], ['BO1', 100], ['BO2', 108]];
for (const [n, y] of out) s += T(219, y + 1, n, 3.2, 'end', 'bold') + dot(222, y, GRN);
// 모터
const motor = (y, t) => box(252, y, 38, 30, '#e9ecef', '#495057', t, 3.4) + `<rect x="262" y="${y + 12}" width="18" height="10" fill="#adb5bd" stroke="#495057" stroke-width=".4"/>` + T(271, y + 19, 'N20', 2.8, 'middle') + `<rect x="283" y="${y + 8}" width="5" height="18" fill="#343a40"/>`;
s += motor(50, '왼쪽 모터');
s += motor(90, '오른쪽 모터');
s += wire([[222, 60], [252, 63]], GRN) + wire([[222, 68], [252, 71]], GRN) + dot(252, 63, GRN) + dot(252, 71, GRN);
s += wire([[222, 100], [252, 103]], GRN) + wire([[222, 108], [252, 111]], GRN) + dot(252, 103, GRN) + dot(252, 111, GRN);
s += T(237, 56, '모터 선 2개', 2.6, 'middle', 'normal', GRN) + T(237, 96, '모터 선 2개', 2.6, 'middle', 'normal', GRN);
// 신호선 Nano -> TB
for (let i = 0; i < 6; i++) { const [, y, c] = nano[2 + i]; s += wire([[152, y], [180, y]], c); }
// 5V -> VCC, STBY
s += wire([[152, 62], [166, 62]], RED) + wire([[166, 58], [166, 66]], RED) + wire([[166, 58], [180, 58]], RED) + wire([[166, 66], [180, 66]], RED) + dot(166, 62, RED);
// GND
s += wire([[152, 74], [180, 74]], BLK);
// GND 버스(아래)
s += wire([[24, 54], [24, 146], [166, 146], [166, 74]], BLK, 1.1) + dot(166, 74) + dot(24, 54, BLK);
s += wire([[80, 46], [80, 146]], BLK, 1.1) + dot(80, 146);
s += T(90, 144, 'GND 공통선 (모두 연결)', 3, 'start', 'bold');
// 배터리 + -> 스위치 -> 갈래
s += wire([[42, 34], [48, 34]], RED, 1.1) + wire([[64, 34], [70, 34]], RED, 1.1);
s += wire([[67, 34], [67, 12], [170, 12], [170, 50], [180, 50]], RED, 1.1) + dot(67, 34, RED);
s += T(140, 10.5, '모터용 전기: 분리 점퍼 → VM (맨 마지막에 연결)', 3, 'middle', 'bold', RED);
// 승압 -> Nano USB
s += wire([[100, 20], [100, 16], [132, 16], [132, 20]], '#495057', 1.4);
s += T(116, 15, 'USB 케이블', 2.6, 'middle');
// 번호
s += num(236, 80, '①') ;
s += num(158, 128, '②') + num(166, 56, '③') + num(160, 78, '④') + num(180, 11, '⑤');
// 범례/설명
s += `<rect x="6" y="152" width="285" height="52" rx="2" fill="#f8f9fa" stroke="#adb5bd" stroke-width=".4"/>`;
const L = [['순서', '① 모터 선 → AO1·AO2(왼쪽), BO1·BO2(오른쪽)   ② 신호선 6개(주황·보라)   ③ Nano 5V → VCC, STBY   ④ GND 공통선   ⑤ 배터리(+) → 분리 점퍼(스위치 대신) → VM (마지막)']];
s += T(10, 159, L[0][1], 3, 'start', 'bold');
const leg = [[RED, '빨강: + 전기(5V 또는 배터리)'], [BLK, '검정: GND(−)'], [ORG, '주황: 방향 신호'], [PUR, '보라: 속도 신호(PWM)'], [GRN, '초록: 모터 선']];
leg.forEach(([c, t], i) => { s += `<line x1="${10 + i * 56}" y1="166" x2="${18 + i * 56}" y2="166" stroke="${c}" stroke-width="1.2"/>` + T(20 + i * 56, 167, t, 2.7); });
const notes = ['· 선이 교차해도 점(●)이 없으면 연결된 것이 아닙니다.', '· TB6612 모듈은 제품마다 핀 순서가 다를 수 있습니다. 핀 이름(글자)을 보고 연결하세요.', '· 모터가 반대로 돌면 그쪽 모터 선 2개(AO1↔AO2 또는 BO1↔BO2)를 서로 바꾸세요.', '· 콘덴서 470µF는 VM과 GND 사이에 연결합니다(긴 다리가 VM). 컴퓨터 USB로 코드를 올릴 때는 분리 점퍼를 뽑아 전원을 끄세요. 홀더에 ON/OFF 스위치가 있으면 그것을 쓰세요.', '· 센서 5개는 이 그림에 없습니다. 센서는 배선도의 A4(SDA), A5(SCL), D2~D6, 5V, GND에 연결합니다.'];
notes.forEach((t, i) => { s += T(10, 174 + i * 6, t, 2.9); });
const html = `<!doctype html><html><head><meta charset="utf-8"><title>모터 배선도</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}.t{position:absolute;left:8mm;top:3mm;font-size:13pt;font-weight:bold}</style></head><body><div class="t">모터 배선도 (TB6612) — 순서대로 ①~⑤</div><svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210" style="position:absolute;left:0;top:0;font-family:inherit">${s}</svg></body></html>`;
fs.writeFileSync('motor.html', html);
