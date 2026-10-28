// 반복 실험(1)과 처음 보는 미로 시험(2)을 함께 수행한다. 시뮬레이터 코드는 읽기만 하고 고치지 않는다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, outFile, only] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens);
const METHODS = ['s9', 's10', 's11', 's12'], MAZES = [26, 1, 2, 3], REPS = 8;
const tasks = [];
for (const m of METHODS) for (const mz of MAZES) for (let r = 0; r < REPS; r++) tasks.push({ m, mz, r });
const mine = tasks.filter((_, i) => i % NW === W).filter(t => !only || (only === 'one' ? t.r === 0 && t.mz === 26 && t.m === 's12' : true));
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ m, mz, r, GENS }) => {
      // init()과 같은 순서로 준비하되 화면 갱신은 하지 않고, 진화 난수만 반복마다 바꾼다 (r=0은 예전 실험과 같은 난수)
      profileEl.value = 'research'; CFG = { ...PROFILES.research }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      presetEl.value = m; document.getElementById('seed').value = mz;
      maze = makeMaze(CFG.N, makeRng(mz));
      const P = PRESETS.find(p => p.key === m); GROUPS = [makeGroup(P)]; const G = GROUPS[0];
      G.rnd = makeRng(r === 0 ? mz * 1000 + 17 + G.rngOffset : 777000 + r * 7919 + mz * 31);
      G.pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => G.rnd.normal()));
      G.hist = []; gen = 0; beginGeneration();
      let first = null; const curve = [];
      for (let g = 0; g <= GENS; g++) {
        const sol = G.runs.filter(x => x.solved).length;
        if (first === null && sol > 0) first = g;
        if (g % 10 === 0) curve.push(sol);
        if (g < GENS) breed();
      }
      const solved = G.runs.filter(x => x.solved);
      const minLen = solved.length ? Math.min(...solved.map(x => x.len)) : null;
      const best = G.pop[G.runs[0].i].slice();
      // (2) 처음 보는 미로 100개에서 최고 개체의 성공 여부 (미로 번호 5000~5099, 훈련 미로와 겹치지 않음)
      let ok = 0, okShort = 0, nShort = 0;
      for (let k = 0; k < 100; k++) {
        const mz2 = makeMaze(CFG.N, makeRng(5000 + k));
        const rr = run(best, mz2, G);
        if (rr.solved) ok++;
        if (mz2.shortest <= 20) { nShort++; if (rr.solved) okShort++; }
      }
      // 훈련한 미로에서의 재확인
      const again = run(best, maze, G).solved;
      return { m, mz, r, first, finalSolved: solved.length, minLen, shortest: maze.shortest * CFG.CELL, curve, testOk: ok, testShortOk: okShort, testShortN: nShort, trainOk: again };
    }, { m: t.m, mz: t.mz, r: t.r, GENS });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
