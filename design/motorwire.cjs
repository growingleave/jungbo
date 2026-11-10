const fs = require('fs');
let s = '';
const T = (x, y, t, fs = 3.4, a = 'start', w = 'normal', fill = '#111') => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${a}" font-weight="${w}" fill="${fill}">${t}</text>`;
s += T(8, 10, 'N20 모터에 전선 땜하기', 5.5, 'start', 'bold');
// 모터 옆모습: 기어박스 + 모터 + 뒤쪽 단자
const mx = 20, my = 30;
s += `<rect x="${mx}" y="${my}" width="30" height="20" rx="2" fill="#adb5bd" stroke="#495057" stroke-width=".6"/>` + T(mx + 15, my + 12, '기어박스', 3, 'middle');
s += `<rect x="${mx + 30}" y="${my + 1}" width="38" height="18" rx="1" fill="#ced4da" stroke="#495057" stroke-width=".6"/>` + T(mx + 49, my + 12, '모터 몸체', 3, 'middle');
s += `<rect x="${mx - 8}" y="${my + 8}" width="8" height="4" fill="#868e96"/>` + T(mx - 8, my - 2, '축(바퀴 쪽)', 3, 'start');
s += `<rect x="${mx + 68}" y="${my + 3}" width="9" height="3" fill="#e9b949" stroke="#8a6d1d" stroke-width=".3"/><rect x="${mx + 68}" y="${my + 14}" width="9" height="3" fill="#e9b949" stroke="#8a6d1d" stroke-width=".3"/>`;
s += `<circle cx="${mx + 74}" cy="${my + 4.5}" r=".8" fill="#fff" stroke="#8a6d1d" stroke-width=".2"/><circle cx="${mx + 74}" cy="${my + 15.5}" r=".8" fill="#fff" stroke="#8a6d1d" stroke-width=".2"/>`;
s += `<line x1="${mx + 72}" y1="${my - 6}" x2="${mx + 72}" y2="${my + 2}" stroke="#c92a2a" stroke-width=".5"/>` + T(mx + 72, my - 8, '금속 단자 2개 (여기에 땜)', 3.2, 'middle', 'bold', '#c92a2a');
s += T(mx + 72, my + 26, '(모터 맨 뒤쪽)', 2.8, 'middle');
// 4단계
const steps = [['① 전선 끝 벗기기', '전선 끝의 피복(색 있는 껍질)을\n3mm 정도 벗겨 금속 선이 보이게 합니다.'], ['② 납 묻혀 두기', '벗긴 전선 끝과 모터 단자에\n납을 아주 조금씩 미리 묻혀 둡니다.'], ['③ 맞대고 가열', '전선을 단자에 대고 인두를\n1~2초만 댑니다. 납이 붙으면 뗍니다.'], ['④ 확인', '전선을 살짝 당겨 봐서 안 빠지면 성공.\n두 단자의 납이 닿지 않아야 합니다.']];
steps.forEach(([t, d], i) => {
  const x = 8 + (i % 2) * 100, y = 80 + Math.floor(i / 2) * 46;
  s += `<rect x="${x}" y="${y}" width="94" height="40" rx="2" fill="#fff9db" stroke="#e6a800" stroke-width=".5"/>`;
  s += T(x + 4, y + 8, t, 4, 'start', 'bold');
  d.split('\n').forEach((l, k) => { s += T(x + 4, y + 16 + k * 6, l, 3.1); });
});
s += `<rect x="8" y="176" width="194" height="40" rx="2" fill="#fff5f5" stroke="#e03131" stroke-width=".5"/>`;
const notes = ['주의할 점', '· 인두를 오래 대면 모터 안쪽(플라스틱)이 녹습니다. 한 단자에 3초 이내로 합니다.', '· 두 단자에 납이 이어지면 안 됩니다(전기가 새서 모터가 안 돕니다).', '· 어느 선이 어느 단자인지는 상관없습니다. 돌려 보고 방향이 반대면 선만 바꾸면 됩니다.'];
notes.forEach((t, i) => { s += T(12, 184 + i * 7.5, t, i === 0 ? 3.8 : 3.1, 'start', i === 0 ? 'bold' : 'normal', i === 0 ? '#c92a2a' : '#111'); });
s += T(8, 224, '팁: 암-수 점퍼선을 한가운데에서 자르면 전선 2개가 됩니다. 암(구멍) 쪽 반을 모터에 땜하면', 3.1, 'start', 'bold');
s += T(8, 230, 'TB6612의 핀 헤더에 그대로 꽂을 수 있습니다.', 3.1, 'start', 'bold');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="212mm" height="236mm" viewBox="0 0 212 236" font-family="inherit">${s}</svg></body></html>`;
fs.writeFileSync('motorwire.html', html);
