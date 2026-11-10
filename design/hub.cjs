// 센서 5개 허브(브레드보드 B) 연결 그림, 초보용
const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
const C = { v: '#d9242f', g: '#111', d: '#ef6c00', c: '#e6a800' };
// 브레드보드 B : 세로 줄 8개 사용 (각 줄 = 위아래로 5칸이 서로 연결)
const x0 = 14, y0 = 40, px = 17, py = 7;
const groups = [['5V', C.v, [0, 1]], ['GND', C.g, [2, 3]], ['SDA', C.d, [4, 5]], ['SCL', C.c, [6, 7]]];
s += T(8, 10, '센서 5개를 한 판에 모으는 방법 (브레드보드 B)', 5, 'start', 'bold');
s += T(8, 17, '세로 5칸은 안에서 서로 연결되어 있습니다. 5칸이 모자라서, 이웃한 두 줄을 짧은 선으로 이어서 씁니다.', 3);
s += `<rect x="${x0 - 8}" y="${y0 - 8}" width="${px * 8 + 16}" height="${py * 5 + 34}" rx="2" fill="#f8f9fa" stroke="#adb5bd" stroke-width=".6"/>`;
groups.forEach(([name, c, cols], gi) => {
  cols.forEach((col, k) => {
    const cx = x0 + col * px;
    for (let r = 0; r < 5; r++) {
      const cy = y0 + r * py;
      s += `<circle cx="${cx}" cy="${cy}" r="1.6" fill="#ced4da"/>`;
    }
    s += `<rect x="${cx - 4}" y="${y0 - 4}" width="8" height="${py * 4 + 8}" rx="2" fill="${c}" fill-opacity=".13" stroke="${c}" stroke-width=".4"/>`;
  });
  // 사용 구멍 표시: 첫 줄 = 위에서 Nano 1, 이어주는 선 1, 센서 3 / 둘째 줄 = 이어주는 선 1, 센서 2
  const [c1, c2] = cols.map(c => x0 + c * px);
  const used1 = ['N', 'B', 'S', 'S', 'S'], used2 = ['B', 'S', 'S', '', ''];
  used1.forEach((u, r) => { if (u) s += `<circle cx="${c1}" cy="${y0 + r * py}" r="2.2" fill="${u === 'N' ? '#3b5bdb' : u === 'B' ? '#868e96' : '#2f9e5b'}"/>`; });
  used2.forEach((u, r) => { if (u) s += `<circle cx="${c2}" cy="${y0 + r * py}" r="2.2" fill="${u === 'B' ? '#868e96' : '#2f9e5b'}"/>`; });
  s += `<path d="M${c1},${y0 + py} q${px / 2},-9 ${px},0" fill="none" stroke="#868e96" stroke-width="1"/>`;
  s += T((c1 + c2) / 2, y0 - 9, name, 4.2, 'middle', 'bold', c);
});
s += T(x0 - 6, y0 + py * 5 + 6, '파랑 점: Nano에서 오는 선 1개', 3); s += T(x0 + 40, y0 + py * 5 + 6, '초록 점: 센서로 가는 선(줄마다 5개)', 3); s += T(x0 + 100, y0 + py * 5 + 6, '회색 호: 두 줄을 잇는 짧은 선', 3);
s += T(x0 - 6, y0 + py * 5 + 12, '※ 5V 줄 = VIN, GND 줄 = GND, SDA 줄 = SDA, SCL 줄 = SCL 로 센서마다 한 개씩 꽂습니다.', 2.9);
// 표
const ty = 108;
s += `<rect x="6" y="${ty}" width="200" height="92" rx="2" fill="#fff9db" stroke="#e6a800" stroke-width=".5"/>`;
s += T(10, ty + 7, '센서마다 따로 연결하는 것 (XSHUT)', 3.8, 'start', 'bold');
const rows = [['센서 1 (왼쪽 90°)', 'D2'], ['센서 2 (왼쪽 앞 45°)', 'D3'], ['센서 3 (앞)', 'D4'], ['센서 4 (오른쪽 앞 45°)', 'D5'], ['센서 5 (오른쪽 90°)', 'D6']];
rows.forEach(([a, b], i) => { s += T(12, ty + 15 + i * 6, `${a}의 XSHUT 선  →  Nano ${b}`, 3.2); });
s += T(10, ty + 50, '센서 5개 모두에 이 4개 선도 연결합니다 (허브 → 센서)', 3.4, 'start', 'bold');
['센서 VIN ← 허브 5V 줄', '센서 GND ← 허브 GND 줄', '센서 SDA ← 허브 SDA 줄', '센서 SCL ← 허브 SCL 줄'].forEach((t, i) => { s += T(12 + (i % 2) * 75, ty + 57 + Math.floor(i / 2) * 5.5, t, 3.2); });
s += T(10, ty + 70, '허브 4줄은 Nano에서 1개씩 이어서 받습니다:', 3.4, 'start', 'bold');
['Nano +5V → 허브 5V 줄', 'Nano GND → 허브 GND 줄', 'Nano A4 → 허브 SDA 줄', 'Nano A5 → 허브 SCL 줄'].forEach((t, i) => { s += T(12 + (i % 2) * 75, ty + 77 + Math.floor(i / 2) * 5.5, t, 3.2); });
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="212mm" height="212mm" viewBox="0 0 212 212" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('hub.html', html);
