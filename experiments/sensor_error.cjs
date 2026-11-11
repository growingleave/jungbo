// 센서 장착 오차(거리 편향, 각도 오차, 옆으로 어긋남)가 있을 때, 학습된 로봇이 얼마나 도착하는지 시험한다.
// 시뮬레이터 코드는 읽기만 하고 고치지 않는다(시험할 때만 함수를 감싸서 오차를 넣는다).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, outFile, cond] = process.argv;
const W = Number(wi), NW = Number(nw);
const SEEDS = [365, 350, 80, 178], REPS = 3;
const tasks = []; for (const mz of SEEDS) for (let r = 0; r < REPS; r++) tasks.push({ mz, r });
const mine = tasks.filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ mz, r, cond }) => {
      profileEl.value = 'real'; CFG = { ...PROFILES.real }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      presetEl.value = 's12'; document.getElementById('seed').value = mz;
      maze = makeMaze(CFG.N, makeRng(mz));
      const P = PRESETS.find(p => p.key === 's12'); GROUPS = [makeGroup(P)]; const G = GROUPS[0];
      G.rnd = makeRng(777000 + r * 7919 + mz * 31);
      G.pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => G.rnd.normal()));
      const origRun = run, trnd = makeRng(4242 + mz + r); let tIdx = 0;
      const origSense0 = senseOne;
      let tc = { bias: [0, 0, 0, 0, 0], lat: [0, 0, 0, 0, 0] };
      if (cond === 'noisy') {
        senseOne = (near, x, y, ang) => { const lat = tc.lat[tIdx], ox = x - Math.sin(ang) * lat, oy = y + Math.cos(ang) * lat; return Math.max(0, Math.min(CFG.SENSOR_MAX, origSense0(near, ox, oy, ang) + tc.bias[tIdx])); };
        run = (gene, mz2, GG) => { tc.bias = GG.angles.map(() => trnd.normal(0, 1)); tc.lat = GG.angles.map(() => trnd.normal(0, .3)); const arr = GG.angles.map(a => a + trnd.normal(0, 3 * Math.PI / 180)); const G3 = { ...GG, angles: new Proxy(arr, { get(t, p) { if (typeof p === 'string' && /^\d+$/.test(p)) tIdx = Number(p); return t[p]; } }) }; return origRun(gene, mz2, G3); };
      }
      G.hist = []; gen = 0; beginGeneration();
      for (let g = 0; g < 150; g++) breed();
      run = origRun; senseOne = origSense0;
      const best = G.pop[G.runs[0].i].slice(), base = run(best, maze, G).solved;
      const origSense = senseOne, rnd = makeRng(99 + mz + r);
      let cur = { bias: [], lat: [], ang: [] }, idx = 0;
      senseOne = (near, x, y, ang) => { const lat = cur.lat[idx], ox = x - Math.sin(ang) * lat, oy = y + Math.cos(ang) * lat; return Math.max(0, Math.min(CFG.SENSOR_MAX, origSense(near, ox, oy, ang) + cur.bias[idx])); };
      const trial = (sb, sa, sl) => { // 센서 5개 각각에 정규분포 오차(표준편차)를 넣고 한 번 달려 도착 여부를 본다
        cur.bias = G.angles.map(() => rnd.normal(0, sb)); cur.lat = G.angles.map(() => rnd.normal(0, sl));
        const arr = G.angles.map(a => a + rnd.normal(0, sa * Math.PI / 180)); const G2 = { ...G, angles: new Proxy(arr, { get(t, p) { if (typeof p === 'string' && /^\d+$/.test(p)) idx = Number(p); return t[p]; } }) };
        return run(best, maze, G2).solved;
      };
      const levels = { '오차 없음': [0, 0, 0], '거리 ±0.5cm': [.5, 0, 0], '거리 ±1cm': [1, 0, 0], '거리 ±2cm': [2, 0, 0], '각도 ±2°': [0, 2, 0], '각도 ±5°': [0, 5, 0], '각도 ±10°': [0, 10, 0], '옆으로 ±0.3cm': [0, 0, .3], '옆으로 ±0.6cm': [0, 0, .6], '모두(거리1cm+각도3°+옆0.3cm)': [1, 3, .3] };
      const out = {}; const N = 60;
      for (const [k, [sb, sa, sl]] of Object.entries(levels)) { let ok = 0; for (let i = 0; i < N; i++) if (trial(sb, sa, sl)) ok++; out[k] = ok / N; }
      senseOne = origSense;
      return { mz, r, cond, trained: base, levels: out };
    }, { mz: t.mz, r: t.r, cond });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
