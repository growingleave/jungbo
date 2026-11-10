const { upper, lower, holes, R, poly } = require('./layout.cjs');
const fs = require('fs');
const C = { u: '#2f9e5b', l: '#6b7280' };
const col = n => n.includes('브레드보드') ? '#6b7280' : n.startsWith('ToF') ? '#2f9e5b' : n.includes('Nano') ? '#2f6bff' : n.includes('AAA') ? '#e8a317' : n.includes('모터') ? '#6b7280' : n.includes('TB') ? '#d6336c' : n.includes('승압') ? '#ef8a00' : n.includes('콘덴서') ? '#374151' : '#9aa5b4';
const pts = r => poly(r).map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
const label = (r, size0 = 2.6) => { const size = r.w < 20 ? 2.1 : size0; return labelRaw(r, size); };
const labelRaw = (r, size = 2.6) => r.name.startsWith('ToF') ? '' : `<text x="${r.cx}" y="${r.cy + size / 3 + (r.name === '미니 브레드보드 A' ? 13 : 0)}" font-size="${size}" text-anchor="middle" fill="#111" font-family="sans-serif">${r.w < 20 ? r.name.replace('5V ', '') + ' ' + r.w + '×' + r.h : r.name + ' ' + r.w + '×' + r.h}</text>`;
const sensLabel = upper.filter(r => r.name.startsWith('ToF')).map(r => { const d = r.deg, a = d * Math.PI / 180, x = 58 * Math.sin(a), y = -58 * Math.cos(a) - (Math.abs(d) === 90 ? 6 : 0); return `<text x="${x}" y="${y}" font-size="2.6" text-anchor="middle" font-family="sans-serif" fill="#1b7a43">ToF ${d > 0 ? '+' : ''}${d}°</text>`; }).join('');
function plate(title, parts, extra, flats) {
  const S = 72; // 그림 영역 반폭
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * S}mm" height="${2 * S}mm" viewBox="${-S} ${-S} ${2 * S} ${2 * S}">`;
  s += `<line x1="${-S}" y1="0" x2="${S}" y2="0" stroke="#bbb" stroke-width=".2" stroke-dasharray="2 1"/><line x1="0" y1="${-S}" x2="0" y2="${S}" stroke="#bbb" stroke-width=".2" stroke-dasharray="2 1"/>`;
  s += flats ? `<path d="M 46,-30.15 A 55 55 0 0 0 -46,-30.15 L -46,30.15 A 55 55 0 0 0 46,30.15 Z" fill="#f8fafc" stroke="#111" stroke-width=".5"/><text x="0" y="-27" font-size="2.2" text-anchor="middle" font-family="sans-serif" fill="#555"></text>` : `<circle r="${R}" fill="#f8fafc" stroke="#111" stroke-width=".5"/>`;
  s += extra || '';
  for (const r of parts) s += `<polygon points="${pts(r)}" fill="${col(r.name)}" fill-opacity=".28" stroke="${col(r.name)}" stroke-width=".4"/>` + (r.name === '콘덴서' ? `<text x="${r.cx}" y="${r.cy + 8}" font-size="2.4" text-anchor="middle" font-family="sans-serif">콘덴서 Ø8</text>` : label(r));
  for (const h of holes) s += `<circle cx="${h[0]}" cy="${h[1]}" r="1.6" fill="#fff" stroke="#c92a2a" stroke-width=".4"/><line x1="${h[0] - 3}" y1="${h[1]}" x2="${h[0] + 3}" y2="${h[1]}" stroke="#c92a2a" stroke-width=".2"/><line x1="${h[0]}" y1="${h[1] - 3}" x2="${h[0]}" y2="${h[1] + 3}" stroke="#c92a2a" stroke-width=".2"/>`;
  s += `<line x1="30" y1="${-R + 2}" x2="30" y2="${-R - 8}" stroke="#111" stroke-width=".4" marker-end="url(#a)"/><text x="33" y="${-R - 3}" font-size="3" font-family="sans-serif">앞</text>`;
  // 지름 치수선
  s += `<line x1="${-R}" y1="${R + 6}" x2="${R}" y2="${R + 6}" stroke="#111" stroke-width=".3"/><line x1="${-R}" y1="${R + 4}" x2="${-R}" y2="${R + 8}" stroke="#111" stroke-width=".3"/><line x1="${R}" y1="${R + 4}" x2="${R}" y2="${R + 8}" stroke="#111" stroke-width=".3"/><text x="0" y="${R + 5}" font-size="3" text-anchor="middle" font-family="sans-serif">Ø110</text>`;
  s += `<defs><marker id="a" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#111"/></marker></defs></svg>`;
  return s;
}
const wheels = [-1, 1].map(sg => `<rect x="${sg > 0 ? 47 : -55}" y="-17" width="8" height="34" fill="#374151" fill-opacity=".25" stroke="#374151" stroke-width=".4" stroke-dasharray="1.5 1"/>`).join('') + `<text x="-51" y="-19" font-size="2.4" text-anchor="middle" font-family="sans-serif">바퀴 Ø34</text><text x="51" y="-19" font-size="2.4" text-anchor="middle" font-family="sans-serif">바퀴 Ø34</text>`;
const wheelAxle = `<text x="-51" y="21" font-size="2.2" text-anchor="middle" font-family="sans-serif" fill="#555">축 y=0</text><text x="51" y="21" font-size="2.2" text-anchor="middle" font-family="sans-serif" fill="#555">축 y=0</text>`;
const sensLabel2 = sensLabel;
const beams = [-90, -45, 0, 45, 90].map(d => { const a = d * Math.PI / 180; return `<line x1="${50 * Math.sin(a)}" y1="${-50 * Math.cos(a)}" x2="${55 * Math.sin(a)}" y2="${-55 * Math.cos(a)}" stroke="#2f9e5b" stroke-width=".4" stroke-dasharray="1 .8"/>`; }).join('');
const side = (() => {
  const W = 170, H = 92; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="-85 -84 ${W} ${H}">`;
  const Z = z => -z;
  const box = (x1, x2, z1, z2, color, text, size = 2.6) => `<rect x="${x1}" y="${Z(z2)}" width="${x2 - x1}" height="${z2 - z1}" fill="${color}" fill-opacity=".3" stroke="${color}" stroke-width=".3"/><text x="${(x1 + x2) / 2}" y="${Z((z1 + z2) / 2) + size / 3}" font-size="${size}" text-anchor="middle" font-family="sans-serif">${text}</text>`;
  s += `<line x1="-85" y1="0" x2="85" y2="0" stroke="#111" stroke-width=".5"/>`;
  s += `<circle cx="0" cy="${Z(17)}" r="17" fill="none" stroke="#374151" stroke-width=".4" stroke-dasharray="2 1"/><text x="10" y="${Z(2)}" font-size="2.6" font-family="sans-serif" fill="#374151">바퀴 Ø34(판 옆, 점선)</text>`;
  s += `<circle cx="-45" cy="${Z(5)}" r="5" fill="#cbd5e1" stroke="#555" stroke-width=".4"/><rect x="-47" y="${Z(24)}" width="4" height="19" fill="#cbd5e1" stroke="#555" stroke-width=".3"/><text x="-45" y="-12" font-size="2.4" text-anchor="middle" font-family="sans-serif">캐스터</text>`;
  s += `<rect x="-55" y="${Z(24)}" width="110" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/><rect x="-55" y="${Z(56)}" width="110" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/>`;
  for (const x of [-24, 14]) s += `<rect x="${x - 1.6}" y="${Z(54)}" width="3.2" height="30" fill="#e5e7eb" stroke="#555" stroke-width=".3"/>`;
  s += `<text x="19" y="${Z(39)}" font-size="2.4" font-family="sans-serif" transform="rotate(-90 19 ${Z(39)})" text-anchor="middle">스탠드오프 30</text>`;
  s += box(-6, 6, 12, 22, '#6b7280', '모터', 2.4);
  s += box(-25.5, 21.5, 24, 32.5, '#6b7280', '브레드보드 B', 2.6);
  s += box(-38.5, -13.5, 24, 32.5, '#ef8a00', '승압', 2.4);
  s += box(-40.5, -3.5, 56, 71, '#e8a317', 'AAA×3 홀더', 2.6);
  s += box(0.5, 35.5, 56, 64.5, '#6b7280', '브레드보드 A', 2.4);
  s += box(2.5, 33.5, 64.5, 72, '#2f6bff', 'Nano', 2.4);
  s += `<rect x="49" y="${Z(76)}" width="5" height="20" fill="#2f9e5b" fill-opacity=".35" stroke="#2f9e5b" stroke-width=".3"/><text x="43" y="${Z(66)}" font-size="2.4" text-anchor="middle" font-family="sans-serif">ToF(세움)</text><line x1="54" y1="${Z(70)}" x2="76" y2="${Z(70)}" stroke="#2f9e5b" stroke-width=".4" stroke-dasharray="1.5 1"/><text x="65" y="${Z(71.5)}" font-size="2.4" text-anchor="middle" font-family="sans-serif" fill="#1b7a43">빔 높이 약 70</text>`;
  s += `<line x1="80" y1="0" x2="80" y2="${Z(76)}" stroke="#111" stroke-width=".3"/><text x="-84" y="${Z(24) - 1}" font-size="2.4" font-family="sans-serif">아래판 z=22~24</text><text x="-84" y="${Z(56) - 1}" font-size="2.4" font-family="sans-serif">위판 z=54~56</text><text x="-84" y="-79" font-size="3.2" font-family="sans-serif" font-weight="bold">옆면도 (오른쪽이 앞, 1:1)</text><text x="62" y="${Z(80)}" font-size="2.6" font-family="sans-serif">전체 높이 약 76</text>`;
  return s + '</svg>';
})();
// 브레드보드 연결도
const wiringSvg = (() => {
  const W = 190, H = 176; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" font-family="sans-serif">`;
  const bx = (x, y, w, h, fill, stroke, t, fs = 3.4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width=".4"/><text x="${x + w / 2}" y="${y + 5}" font-size="${fs}" text-anchor="middle" font-weight="bold">${t}</text>`;
  s += bx(4, 8, 52, 70, '#dbe8ff', '#2f6bff', '브레드보드 A (+ Nano)');
  const pins = [['5V', '#e03131'], ['GND', '#111'], ['A4 (SDA)', '#1971c2'], ['A5 (SCL)', '#1971c2'], ['D2', '#2f9e5b'], ['D3', '#2f9e5b'], ['D4', '#2f9e5b'], ['D5', '#2f9e5b'], ['D6', '#2f9e5b']];
  pins.forEach(([n, c], i) => { const y = 16 + i * 6.2; s += `<circle cx="56" cy="${y}" r="1.2" fill="${c}"/><text x="53" y="${y + 1.1}" font-size="2.9" text-anchor="end">${n}</text>`; });
  s += bx(72, 8, 46, 56, '#eceff4', '#6b7280', '브레드보드 B');
  const bus = [['5V', '#e03131'], ['GND', '#111'], ['SDA', '#1971c2'], ['SCL', '#1971c2']];
  bus.forEach(([n, c], i) => { const y = 18 + i * 10; s += `<rect x="78" y="${y}" width="34" height="3" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-width=".3"/><text x="95" y="${y + 2.4}" font-size="2.7" text-anchor="middle">${n} 줄</text>`; });
  // A→B 4선
  [[0, 0], [1, 1], [2, 2], [3, 3]].forEach(([p, b]) => { const y1 = 16 + p * 6.2, y2 = 19.5 + b * 10; s += `<path d="M56,${y1} C64,${y1} 66,${y2} 78,${y2}" fill="none" stroke="${pins[p][1]}" stroke-width=".7"/>`; });
  // 센서
  const names = ['ToF −90°', 'ToF −45°', 'ToF 0°', 'ToF +45°', 'ToF +90°'];
  names.forEach((n, i) => { const y = 8 + i * 16; s += bx(146, y, 40, 13, '#d3f1de', '#2f9e5b', n, 3); s += `<text x="166" y="${y + 10}" font-size="2.6" text-anchor="middle">VIN GND SDA SCL XSHUT</text>`; });
  bus.forEach(([n, c], i) => names.forEach((_, k) => { const y1 = 19.5 + i * 10, y2 = 14 + k * 16 + (i - 1.5) * 1.2; s += `<path d="M112,${y1} C130,${y1} 132,${y2} 146,${y2}" fill="none" stroke="${c}" stroke-width=".4" opacity=".7"/>`; }));
  // XSHUT 직결
  names.forEach((_, k) => { const y = 21 + k * 16; s += `<path d="M146,${y} C120,${y + 6 + k * 4} 70,${88 + k * 3} 56,${16 + (4 + k) * 6.2}" fill="none" stroke="#2f9e5b" stroke-width=".5" stroke-dasharray="1.5 1"/>`; });
  s += `<text x="95" y="${H - 58}" font-size="3" text-anchor="middle">초록 점선: 센서의 XSHUT는 브레드보드 B를 거치지 않고 Nano의 D2~D6에 하나씩 직접 연결</text>`;
  s += `<text x="4" y="${H - 50}" font-size="3.2" font-weight="bold">선 개수</text>`;
  const lines = ['브레드보드 B의 각 줄(5V, GND, SDA, SCL)은 5구멍 2열을 짧은 선으로 이어서 씁니다', 'A → B: 4개 (5V, GND, A4, A5)', 'B → 센서: 센서 하나에 4개(VIN, GND, SDA, SCL) × 5 = 20개', 'XSHUT: 센서 → Nano 5개 (D2, D3, D4, D5, D6)', 'Nano → TB6612: 6개 (D7, D8, D9, D10, D12, D13) + 5V, GND를 B에서', '합계 점퍼선 약 35개. 센서 쪽은 암-수, 브레드보드 쪽은 수 핀이 맞는 선'];
  lines.forEach((t, i) => { s += `<text x="4" y="${H - 42 + i * 6}" font-size="3">${t}</text>`; });
  return s + '</svg>';
})();
const dims = [
  ['판', 'Ø110, 두께 2 (아래판은 옆면 평평)', '정한 값', '—'], ['미니 브레드보드(2)', '47×35, 높이 8.5 (170구멍)', '어림값', ''], ['바퀴(2)', 'Ø34, 두께 8', '어림값', ''], ['N20 모터(2)', '12×10×27(축 포함 전)', '어림값', ''], ['TB6612 모듈', '20×20', '어림값', ''],
  ['VL53L0X 모듈(5)', '12×20(세워서 바닥 12×5)', '어림값', ''], ['Arduino Nano', '45×18', '규격', '—'], ['AAA×3 홀더', '58×37, 높이 15', '어림값', ''], ['5V 승압(USB형)', '25×16, 높이 8', '어림값', ''], ['캐스터', '구 Ø10, 높이 약 24(판 아래)', '어림값', ''], ['콘덴서 470µF', 'Ø8, 높이 12', '어림값', '']];
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>로봇 설계도</title><style>
@page { size: A4; margin: 0 } *{box-sizing:border-box} body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;color:#111}
.pg{width:210mm;height:297mm;padding:8mm 10mm;position:relative;page-break-after:always;overflow:hidden} h1{font-size:15pt;margin:0 0 1mm} p.s{font-size:8pt;color:#444;margin:0 0 2mm}
.row{display:flex;gap:2mm;align-items:center} svg{display:block} table{border-collapse:collapse;font-size:8.5pt;width:100%} td,th{border:.3mm solid #555;padding:1mm 2mm;text-align:left} th{background:#eee}
ol{font-size:9pt;line-height:1.5;margin:1mm 0 0 5mm;padding:0} .hd{font-size:10pt;font-weight:bold;margin:2mm 0 1mm}
</style></head><body>
<div class="pg"><h1>소형 미로 로봇 설계도 — 브레드보드 포함 (1:1, A4 인쇄용)</h1><p class="s">100%로 인쇄하세요(쪽 맞춤 금지). 모든 부품 치수는 어림값이니 부품을 올려 보고 맞춰 주세요. 센서 모듈은 판 위에 세워서 붙이는 것으로 그렸습니다. 빨간 원은 M3 스탠드오프 구멍 위치(Ø3.2)입니다.</p>
<div class="hd">① 위층 (센서 5개, 브레드보드 A + Nano, 배터리 홀더) — 판 지름 110</div>${plate('위층', upper, '', false).replace('</svg>', beams.replace(/stroke-width=".4"/g,'stroke-width=".5"') + sensLabel2 + '</svg>')}
</div>
<div class="pg"><div class="hd">② 아래층 (모터 2개 판 아래 고정, 브레드보드 B, 드라이버, 승압, 캐스터)</div>${plate('아래층', lower, wheels + wheelAxle, true)}
<p class="s">아래판은 바퀴가 닿지 않게 옆면을 x=±46에서 평평하게 자릅니다(바퀴 안쪽 면 x=±47, 전체 폭 약 110). 그림의 모터는 판 위에서 본 위치이며 실제로는 판 아래에 브라켓으로 고정하고, 바퀴 축은 판의 중심선(y=0) 위에 오게 합니다. 캐스터는 뒤쪽(그림의 아래쪽)에 둡니다.</p></div>
<div class="pg"><h1>옆면도와 조립 순서</h1>${side}
<div class="hd">조립 순서</div><ol><li>판 2장을 Ø110으로 자르고 구멍 4개(Ø3.2)를 뚫습니다. 두 판의 구멍 위치는 같습니다.</li><li>아래판 아래에 모터 2개를 브라켓으로 고정하고 바퀴를 끼웁니다(축이 y=0 선 위).</li><li>캐스터를 뒤쪽에 달고, 바퀴 접지면과 캐스터가 같은 높이(판이 수평)인지 확인합니다.</li><li>아래판 위에 브레드보드 B(양면테이프), TB6612, 승압 모듈, 콘덴서를 붙입니다.</li><li>스탠드오프(높이 30)로 위판을 올립니다.</li><li>위판에 센서 5개(−90°, −45°, 0°, +45°, +90°)를 판 가장자리에 세워서(빔이 바깥을 보게) 붙이고, 브레드보드 A를 붙이고 그 위에 Nano를 꽂은 뒤 배터리 홀더를 붙입니다. 센서 빔 높이는 약 70mm, 미로 벽 높이는 100mm 이상으로 합니다.</li><li>배선도대로 연결하고, 센서 5개의 주소 설정(XSHUT) 코드를 먼저 올려 시험합니다.</li></ol>
<div class="hd">치수 확인표 (부품이 오면 실측해서 적어 주세요)</div><table><tr><th>부품</th><th>설계도에 쓴 치수(mm)</th><th>구분</th><th>실측</th></tr>${dims.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table></div>
<div class="pg"><h1>브레드보드 연결도</h1><p class="s">브레드보드 A에는 Nano를 꽂고, 브레드보드 B는 5V·GND·SDA·SCL을 센서 5개에 나눠 주는 허브입니다. 센서는 브레드보드에 꽂지 않고 판에 세워 붙입니다.</p>${wiringSvg}</div>
</body></html>`;
fs.writeFileSync('design.html', html);
