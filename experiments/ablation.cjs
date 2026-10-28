// 실험 B: 평가 요소를 하나씩 더한 방식끼리, 요소마다 목표로 한 지표(도착, 충돌, 이동 거리, 순위 역전)를 반복해서 잰다.
// 시뮬레이터 코드는 읽기만 하고 고치지 않는다. 난수 규칙은 repeat_generalize.cjs와 같다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, outFile] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens);
const METHODS = ['s2', 's4', 's5', 's6', 's8', 's9', 's10', 's11', 's12'], MAZES = [26, 1, 2, 3], REPS = 8;
const tasks = [];
for (let r = 0; r < REPS; r++) for (const mz of MAZES) for (const m of METHODS) tasks.push({ m, mz, r });
const mine = tasks.filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ m, mz, r, GENS }) => {
      profileEl.value = 'research'; CFG = { ...PROFILES.research }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      presetEl.value = m; document.getElementById('seed').value = mz;
      maze = makeMaze(CFG.N, makeRng(mz));
      const P = PRESETS.find(p => p.key === m); GROUPS = [makeGroup(P)]; const G = GROUPS[0];
      G.rnd = makeRng(r === 0 ? mz * 1000 + 17 + G.rngOffset : 777000 + r * 7919 + mz * 31);
      G.pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => G.rnd.normal()));
      G.hist = []; gen = 0; beginGeneration();
      let first = null, inv = 0, gensWithSol = 0;
      for (let g = 0; g <= GENS; g++) {
        const sol = G.runs.filter(x => x.solved);
        if (first === null && sol.length > 0) first = g;
        if (sol.length) { gensWithSol++; if (!G.runs[0].solved) inv++; }   // 순위 역전: 도착 개체가 있는데 1위가 미도착인 세대
        if (g < GENS) breed();
      }
      const sol = G.runs.filter(x => x.solved);
      const minLen = sol.length ? Math.min(...sol.map(x => x.len)) : null;
      const bumpsMean = sol.length ? sol.reduce((a, x) => a + x.bumps, 0) / sol.length : null;
      const bestSolved = sol.length ? sol.reduce((a, x) => x.f > a.f ? x : a) : null;
      return { m, mz, r, first, finalSolved: sol.length, minLen, bumpsMean, bumpsBest: bestSolved ? bestSolved.bumps : null, inv, gensWithSol, shortest: maze.shortest * CFG.CELL };
    }, { m: t.m, mz: t.mz, r: t.r, GENS });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
