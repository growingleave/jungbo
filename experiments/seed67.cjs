// 시드 67 미로에서 단계 10의 탐험 보상 최대값을 10(기본)과 30으로 달리해 반복한다. 시뮬레이터 코드는 읽기만 한다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, outFile] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens);
const tasks = [];
for (let r = 0; r < 8; r++) for (const ex of [10, 30]) tasks.push({ ex, r });
const done = new Set(fs.readdirSync('.').filter(f => /^results_S67_w\d+\.jsonl$/.test(f)).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => { const o = JSON.parse(l); return o.ex + '_' + o.r; })));
const mine = tasks.filter(t => !done.has(t.ex + '_' + t.r)).filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ ex, r, GENS }) => {
      profileEl.value = 'research'; CFG = { ...PROFILES.research }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      const mz = 67; presetEl.value = 's10'; document.getElementById('seed').value = mz; exploreEl.value = ex;
      maze = makeMaze(CFG.N, makeRng(mz));
      const P = PRESETS.find(p => p.key === 's10'); GROUPS = [makeGroup(P)]; const G = GROUPS[0];
      G.rnd = makeRng(r === 0 ? mz * 1000 + 17 + G.rngOffset : 777000 + r * 7919 + mz * 31);
      G.pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => G.rnd.normal()));
      G.hist = []; gen = 0; beginGeneration();
      let first = null;
      for (let g = 0; g <= GENS; g++) { if (first === null && G.runs.some(x => x.solved)) first = g; if (g < GENS) breed(); }
      return { ex, r, first, finalSolved: G.runs.filter(x => x.solved).length, exploreMax: G.exploreMax };
    }, { ex: t.ex, r: t.r, GENS });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
