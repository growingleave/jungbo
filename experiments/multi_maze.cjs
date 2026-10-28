// 실험 A: 학습에 쓰는 미로 수(K)에 따른, 처음 보는 미로에서의 성공률. 시뮬레이터 코드는 읽기만 하고 고치지 않는다.
// 적합도(모든 K에서 동일): 미로마다 [도착: 200 - 0.1×이동거리 - 0.2×충돌] [미도착: -목표거리 - 0.2×충돌]을 구해 K개의 평균을 쓴다.
// 진화 규칙은 연구 본문과 같다(상위 20% 보존, 한 점 교차, 돌연변이 5%·0.5). 탐험 보상 등 다른 장치는 쓰지 않는다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, outFile] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens);
const KS = [30, 10, 3, 1], REPS = 6;
const tasks = [];
for (let r = 0; r < REPS; r++) for (const K of KS) tasks.push({ K, r });
// 중간에 끊겨도 이어서 하도록, 이미 끝난 (K, r)은 건너뛴다. 오래 걸리는 K부터 번갈아 나눈다.
const done = new Set(fs.readdirSync('.').filter(f => /^results_A_w\d+\.jsonl$/.test(f)).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => { const o = JSON.parse(l); return o.K + '_' + o.r; })));
const mine = tasks.filter(t => !done.has(t.K + '_' + t.r)).sort((a, b) => b.K - a.K || a.r - b.r).filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ K, r, GENS }) => {
      profileEl.value = 'research'; CFG = { ...PROFILES.research }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      const P = PRESETS.find(p => p.key === 's2'); const G = makeGroup(P);
      // 훈련 미로: 반복마다 다른 번호 30개를 뽑고, K개만 앞에서부터 쓴다(K가 커져도 앞의 미로는 같다). 시험 미로 5000~5099와 겹치지 않는다.
      const pick = makeRng(31337 + r), seeds = [];
      while (seeds.length < 30) { const s = 100 + pick.int(4900); if (!seeds.includes(s)) seeds.push(s); }
      const trainSeeds = seeds.slice(0, K), mazes = trainSeeds.map(s => makeMaze(CFG.N, makeRng(s)));
      const tests = Array.from({ length: 100 }, (_, k) => makeMaze(CFG.N, makeRng(5000 + k)));
      const rnd = makeRng(777000 + r * 7919);                  // 같은 반복이면 K와 관계없이 같은 초기 개체
      let pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => rnd.normal()));
      const fit = g => {
        let f = 0, ok = 0;
        for (const mz of mazes) { const rr = run(g, mz, G); if (rr.solved) { ok++; f += 200 - 0.1 * rr.len - 0.2 * rr.bumps; } else f += -finalDist(rr, mz) - 0.2 * rr.bumps; }
        return { f: f / K, ok };
      };
      const testOk = g => { let ok = 0, okS = 0, nS = 0; for (const mz of tests) { const rr = run(g, mz, G); if (rr.solved) ok++; if (mz.shortest <= 20) { nS++; if (rr.solved) okS++; } } return [ok, okS, nS]; };
      const curve = []; let best = null;
      for (let g = 0; g <= GENS; g++) {
        const sc = pop.map((gene, i) => ({ i, ...fit(gene) })).sort((a, b) => b.f - a.f);
        best = pop[sc[0].i].slice();
        if (g % 25 === 0 || g === GENS) curve.push({ g, trainOk: sc[0].ok, testOk: testOk(best)[0] });
        if (g === GENS) break;
        const parents = sc.slice(0, CFG.POP / 5).map(x => pop[x.i]), next = parents.slice();
        while (next.length < CFG.POP) {
          const a = parents[rnd.int(parents.length)], b2 = parents[rnd.int(parents.length)];
          const cut = 1 + rnd.int(G.geneLen - 1), child = a.slice(0, cut).concat(b2.slice(cut));
          for (let i = 0; i < G.geneLen; i++) if (rnd() < 0.05) child[i] += rnd.normal(0, 0.5);
          next.push(child);
        }
        pop = next;
      }
      const tr = fit(best), [ok, okS, nS] = testOk(best);
      return { K, r, trainSeeds, trainOk: tr.ok, testOk: ok, testShortOk: okS, testShortN: nS, curve };
    }, { K: t.K, r: t.r, GENS });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
