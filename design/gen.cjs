const { upper, lower, holes, R, poly } = require('./layout.cjs');
const fs = require('fs');
const C = { u: '#2f9e5b', l: '#6b7280' };
const col = n => n.startsWith('ToF') ? '#2f9e5b' : n.includes('Nano') ? '#2f6bff' : n.includes('AAA') ? '#e8a317' : n.includes('모터') ? '#6b7280' : n.includes('TB') ? '#d6336c' : n.includes('승압') ? '#ef8a00' : n.includes('콘덴서') ? '#374151' : '#9aa5b4';
const pts = r => poly(r).map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
const label = (r, size = 2.6) => r.name.startsWith('ToF') ? '' : `<text x="${r.cx}" y="${r.cy + size / 3}" font-size="${size}" text-anchor="middle" fill="#111" font-family="sans-serif">${r.name} ${r.w}×${r.h}</text>`;
const sensLabel = upper.filter(r => r.name.startsWith('ToF')).map(r => { const d = r.deg, a = d * Math.PI / 180, x = 58 * Math.sin(a), y = -58 * Math.cos(a) - (Math.abs(d) === 90 ? 6 : 0); return `<text x="${x}" y="${y}" font-size="2.6" text-anchor="middle" font-family="sans-serif" fill="#1b7a43">ToF ${d > 0 ? '+' : ''}${d}°</text>`; }).join('');
function plate(title, parts, extra, flats) {
  const S = 66; // 그림 영역 반폭
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * S}mm" height="${2 * S}mm" viewBox="${-S} ${-S} ${2 * S} ${2 * S}">`;
  s += `<line x1="${-S}" y1="0" x2="${S}" y2="0" stroke="#bbb" stroke-width=".2" stroke-dasharray="2 1"/><line x1="0" y1="${-S}" x2="0" y2="${S}" stroke="#bbb" stroke-width=".2" stroke-dasharray="2 1"/>`;
  s += flats ? `<path d="M 45,-21.8 A 50 50 0 0 0 -45,-21.8 L -45,21.8 A 50 50 0 0 0 45,21.8 Z" fill="#f8fafc" stroke="#111" stroke-width=".5"/><text x="0" y="-27" font-size="2.2" text-anchor="middle" font-family="sans-serif" fill="#555"></text>` : `<circle r="${R}" fill="#f8fafc" stroke="#111" stroke-width=".5"/>`;
  s += extra || '';
  for (const r of parts) s += `<polygon points="${pts(r)}" fill="${col(r.name)}" fill-opacity=".28" stroke="${col(r.name)}" stroke-width=".4"/>` + (r.name === '콘덴서' ? `<text x="${r.cx}" y="${r.cy + 8}" font-size="2.4" text-anchor="middle" font-family="sans-serif">콘덴서 Ø8</text>` : label(r));
  for (const h of holes) s += `<circle cx="${h[0]}" cy="${h[1]}" r="1.6" fill="#fff" stroke="#c92a2a" stroke-width=".4"/><line x1="${h[0] - 3}" y1="${h[1]}" x2="${h[0] + 3}" y2="${h[1]}" stroke="#c92a2a" stroke-width=".2"/><line x1="${h[0]}" y1="${h[1] - 3}" x2="${h[0]}" y2="${h[1] + 3}" stroke="#c92a2a" stroke-width=".2"/>`;
  s += `<line x1="30" y1="${-R + 2}" x2="30" y2="${-R - 8}" stroke="#111" stroke-width=".4" marker-end="url(#a)"/><text x="33" y="${-R - 3}" font-size="3" font-family="sans-serif">앞</text>`;
  // 지름 치수선
  s += `<line x1="${-R}" y1="${R + 6}" x2="${R}" y2="${R + 6}" stroke="#111" stroke-width=".3"/><line x1="${-R}" y1="${R + 4}" x2="${-R}" y2="${R + 8}" stroke="#111" stroke-width=".3"/><line x1="${R}" y1="${R + 4}" x2="${R}" y2="${R + 8}" stroke="#111" stroke-width=".3"/><text x="0" y="${R + 5}" font-size="3" text-anchor="middle" font-family="sans-serif">Ø100</text>`;
  s += `<defs><marker id="a" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#111"/></marker></defs></svg>`;
  return s;
}
const wheels = [-1, 1].map(sg => `<rect x="${sg > 0 ? 46 : -54}" y="-17" width="8" height="34" fill="#374151" fill-opacity=".25" stroke="#374151" stroke-width=".4" stroke-dasharray="1.5 1"/>`).join('') + `<text x="-51" y="-19" font-size="2.4" text-anchor="middle" font-family="sans-serif">바퀴 Ø34</text><text x="51" y="-19" font-size="2.4" text-anchor="middle" font-family="sans-serif">바퀴 Ø34</text>`;
const wheelAxle = `<line x1="-18" y1="0" x2="18" y2="0" stroke="#111" stroke-width=".3" stroke-dasharray="3 1"/><text x="0" y="-1.5" font-size="2.2" text-anchor="middle" font-family="sans-serif" fill="#555">바퀴 축 y=0</text>`;
const sensLabel2 = sensLabel;
const beams = [-90, -45, 0, 45, 90].map(d => { const a = d * Math.PI / 180; return `<line x1="${50 * Math.sin(a)}" y1="${-50 * Math.cos(a)}" x2="${55 * Math.sin(a)}" y2="${-55 * Math.cos(a)}" stroke="#2f9e5b" stroke-width=".4" stroke-dasharray="1 .8"/>`; }).join('');
const side = (() => {
  const W = 170, H = 86; let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="-75 -80 ${W} ${H}">`; // y는 위가 -, 바닥이 0
  const Z = z => -z;
  s += `<line x1="-75" y1="0" x2="75" y2="0" stroke="#111" stroke-width=".5"/>`;
  // 바퀴(옆에서 보면 원): 가운데 y축 기준 오른쪽이 앞
  s += `<circle cx="0" cy="${Z(17)}" r="17" fill="none" stroke="#374151" stroke-width=".4" stroke-dasharray="2 1"/><text x="9" y="${Z(2)}" font-size="2.6" font-family="sans-serif" fill="#374151">바퀴 Ø34(판 옆, 점선)</text>`;
  // 캐스터(뒤)
  s += `<circle cx="-42" cy="${Z(5)}" r="5" fill="#cbd5e1" stroke="#555" stroke-width=".4"/><rect x="-44" y="${Z(24)}" width="4" height="19" fill="#cbd5e1" stroke="#555" stroke-width=".3"/><text x="-42" y="-3" font-size="2.4" text-anchor="middle" font-family="sans-serif">캐스터</text>`;
  // 아래판 z 22~24, 위판 z 54~56
  s += `<rect x="-50" y="${Z(24)}" width="100" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/><rect x="-50" y="${Z(56)}" width="100" height="2" fill="#94a3b8" stroke="#475569" stroke-width=".3"/>`;
  s += `<rect x="-38" y="${Z(54)}" width="3.2" height="30" fill="#e5e7eb" stroke="#555" stroke-width=".3"/><rect x="35" y="${Z(54)}" width="3.2" height="30" fill="#e5e7eb" stroke="#555" stroke-width=".3"/><text x="-36.5" y="${Z(39)}" font-size="2.4" font-family="sans-serif" transform="rotate(-90 -36.5 ${Z(39)})" text-anchor="middle">스탠드오프 30</text>`;
  // 모터(판 아래, 축 높이 17)
  s += `<rect x="-14" y="${Z(22)}" width="28" height="10" fill="#6b7280" fill-opacity=".4" stroke="#6b7280" stroke-width=".3"/><text x="0" y="${Z(15.5)}" font-size="2.6" text-anchor="middle" font-family="sans-serif">N20 모터(판 아래)</text>`;
  // 아래층 위 부품
  s += `<rect x="-12" y="${Z(32)}" width="25" height="8" fill="#ef8a00" fill-opacity=".3" stroke="#ef8a00" stroke-width=".3"/><text x="0" y="${Z(26.5)}" font-size="2.4" text-anchor="middle" font-family="sans-serif">승압</text>`;
  // 위층 부품
  s += `<rect x="-29" y="${Z(71)}" width="58" height="15" fill="#e8a317" fill-opacity=".3" stroke="#e8a317" stroke-width=".3"/><text x="0" y="${Z(62.5)}" font-size="2.6" text-anchor="middle" font-family="sans-serif">AAA×3 홀더</text>`;
  s += `<rect x="-22" y="${Z(68)}" width="45" height="0" stroke="none"/>`;
  s += `<rect x="44" y="${Z(76)}" width="5" height="20" fill="#2f9e5b" fill-opacity=".35" stroke="#2f9e5b" stroke-width=".3"/><text x="36" y="${Z(66)}" font-size="2.4" text-anchor="middle" font-family="sans-serif">ToF(세움)</text><line x1="49" y1="${Z(70)}" x2="70" y2="${Z(70)}" stroke="#2f9e5b" stroke-width=".4" stroke-dasharray="1.5 1"/><text x="59" y="${Z(71.5)}" font-size="2.4" text-anchor="middle" font-family="sans-serif" fill="#1b7a43">빔 높이 약 70</text>`;
  // 치수
  s += `<line x1="72" y1="0" x2="72" y2="${Z(76)}" stroke="#111" stroke-width=".3"/><text x="73" y="${Z(38)}" font-size="2.8" font-family="sans-serif">전체 높이</text><text x="73" y="${Z(34)}" font-size="2.8" font-family="sans-serif">약 76</text>`;
  s += `<text x="-74" y="-76" font-size="3.2" font-family="sans-serif" font-weight="bold">옆면도 (오른쪽이 앞, 1:1)</text>`;
  s += `<text x="-74" y="${Z(24) - 1}" font-size="2.4" font-family="sans-serif">아래판 z=22~24</text><text x="-74" y="${Z(56) - 1}" font-size="2.4" font-family="sans-serif">위판 z=54~56</text>`;
  return s + '</svg>';
})();
const dims = [
  ['판', 'Ø100, 두께 2', '정한 값', '—'], ['바퀴(2)', 'Ø34, 두께 8', '어림값', ''], ['N20 모터(2)', '12×10×27(축 포함 전)', '어림값', ''], ['TB6612 모듈', '20×20', '어림값', ''],
  ['VL53L0X 모듈(5)', '12×20(세워서 바닥 12×5)', '어림값', ''], ['Arduino Nano', '45×18', '규격', '—'], ['AAA×3 홀더', '58×37, 높이 15', '어림값', ''], ['5V 승압(USB형)', '25×16, 높이 8', '어림값', ''], ['캐스터', '구 Ø10, 높이 약 24(판 아래)', '어림값', ''], ['콘덴서 470µF', 'Ø8, 높이 12', '어림값', '']];
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>로봇 설계도</title><style>
@page { size: A4; margin: 0 } *{box-sizing:border-box} body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;color:#111}
.pg{width:210mm;height:297mm;padding:8mm 10mm;position:relative;page-break-after:always;overflow:hidden} h1{font-size:15pt;margin:0 0 1mm} p.s{font-size:8pt;color:#444;margin:0 0 2mm}
.row{display:flex;gap:2mm;align-items:center} svg{display:block} table{border-collapse:collapse;font-size:8.5pt;width:100%} td,th{border:.3mm solid #555;padding:1mm 2mm;text-align:left} th{background:#eee}
ol{font-size:9pt;line-height:1.5;margin:1mm 0 0 5mm;padding:0} .hd{font-size:10pt;font-weight:bold;margin:2mm 0 1mm}
</style></head><body>
<div class="pg"><h1>소형 미로 로봇 설계도 (1:1, A4 인쇄용)</h1><p class="s">100%로 인쇄하세요(쪽 맞춤 금지). 모든 부품 치수는 어림값이니 부품을 올려 보고 맞춰 주세요. 센서 모듈은 판 위에 세워서 붙이는 것으로 그렸습니다. 빨간 원은 M3 스탠드오프 구멍 위치(Ø3.2)입니다.</p>
<div class="hd">① 위층 (센서 5개, Nano, 배터리 홀더)</div>${plate('위층', upper, '', false).replace('</svg>', beams.replace(/stroke-width=".4"/g,'stroke-width=".5"') + sensLabel2 + '</svg>')}
</div>
<div class="pg"><div class="hd">② 아래층 (모터 2개 판 아래 고정, 드라이버, 승압, 캐스터)</div>${plate('아래층', lower, wheels + wheelAxle, true)}
<p class="s">아래판은 바퀴가 닿지 않게 옆면을 x=±45에서 평평하게 자릅니다(바퀴 안쪽 면 x=±46). 그림의 모터는 판 위에서 본 위치이며 실제로는 판 아래에 브라켓으로 고정하고, 바퀴 축은 판의 중심선(y=0) 위에 오게 합니다. 캐스터는 뒤쪽(그림의 아래쪽)에 둡니다.</p></div>
<div class="pg"><h1>옆면도와 조립 순서</h1>${side}
<div class="hd">조립 순서</div><ol><li>판 2장을 Ø100으로 자르고 구멍 4개(Ø3.2)를 뚫습니다. 두 판의 구멍 위치는 같습니다.</li><li>아래판 아래에 모터 2개를 브라켓으로 고정하고 바퀴를 끼웁니다(축이 y=0 선 위).</li><li>캐스터를 뒤쪽에 달고, 바퀴 접지면과 캐스터가 같은 높이(판이 수평)인지 확인합니다.</li><li>아래판 위에 TB6612, 승압 모듈, 콘덴서를 붙입니다.</li><li>스탠드오프(높이 30)로 위판을 올립니다.</li><li>위판에 센서 5개(−90°, −45°, 0°, +45°, +90°)를 판 가장자리에 세워서(빔이 바깥을 보게) 붙이고, Nano와 배터리 홀더를 붙입니다. 센서 빔 높이는 약 70mm, 미로 벽 높이는 100mm 이상으로 합니다.</li><li>배선도대로 연결하고, 센서 5개의 주소 설정(XSHUT) 코드를 먼저 올려 시험합니다.</li></ol>
<div class="hd">치수 확인표 (부품이 오면 실측해서 적어 주세요)</div><table><tr><th>부품</th><th>설계도에 쓴 치수(mm)</th><th>구분</th><th>실측</th></tr>${dims.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table></div>
</body></html>`;
fs.writeFileSync('design.html', html);
