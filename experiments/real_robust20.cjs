// 実機の不完全さ(センサー誤差・モーター差・回転の誤差・円形でない体・遅れ・出発のずれ)を入れて、4x4実機用迷路で学習する。
// 比較: clean(誤差なしで学習) と robust(誤差を入れて学習)。どちらも誤差を入れた新しい試験で成功率を測る。シミュレーター本体は読むだけ。
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, outFile] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens);
const edges = JSON.parse(fs.readFileSync('maze_real_edges.json', 'utf8'));
const tasks = []; for (let r = 0; r < 8; r++) for (const mode of ['robust', 'clean']) tasks.push({ r, mode });
const done = new Set(fs.readdirSync('.').filter(f => /^results_RR20_w\d+\.jsonl$/.test(f)).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => { const o = JSON.parse(l); return o.mode + '_' + o.r; })));
const mine = tasks.filter(t => !done.has(t.mode + '_' + t.r)).filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ r, mode, GENS, edges }) => {
      const SEC = 120;
      profileEl.value = 'real'; CFG = { ...PROFILES.real, N: 4, CELL: 20, TIME_LIMIT: SEC }; STEPS = Math.round(SEC / CFG.DT);
      const n = 4, walls = Array.from({ length: n }, () => Array.from({ length: n }, () => [1, 1, 1, 1]));
      for (const [[x, y], [x2, y2]] of edges) {
        if (x2 === x + 1) { walls[x][y][1] = 0; walls[x2][y2][0] = 0; } else if (x2 === x - 1) { walls[x][y][0] = 0; walls[x2][y2][1] = 0; }
        else if (y2 === y + 1) { walls[x][y][3] = 0; walls[x2][y2][2] = 0; } else { walls[x][y][2] = 0; walls[x2][y2][3] = 0; }
      }
      const mz = { n, walls, start: [0, 0], goal: [n - 1, n - 1] }; mz.shortest = shortestPath(mz); buildGeometry(mz);
      const P0 = PRESETS.find(p => p.key === 's2'); const G = makeGroup(P0);
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      // ----- 실기 오차 한 세트를 뽑는다 (sev=0이면 오차 없음, 1=보통, 1.5/2=더 심함) -----
      const samplePert = (rng, sev) => {
        const U = (a, b) => a + (b - a) * rng(), s = sev;
        return { sev: s, sigma: 0.8 * s, prop: 0.01 * s, drop: 0.01 * s,
          bias: Array.from({ length: 5 }, () => clamp(rng.normal() * 1.0 * s, -2.5 * s, 2.5 * s)),
          floor: [3, 3, 6, 3, 3].map(f => f * (s > 0 ? 1 : 0)),            // 가까이서 못 읽는 거리(cm): 앞 센서(파손)는 6, 나머지 3
          gL: 1 + U(-0.15, 0.15) * s, gR: 1 + U(-0.15, 0.15) * s, vScale: 1 - U(0, 0.3) * s,
          dead: U(0, 0.12) * s, mnoise: 0.05 * s, headNoise: 0.01 * s, turnEff: 1 + U(-0.2, 0.2) * s,
          R: 5.5 + U(0, 1.3) * s, jx: U(-2, 2) * s, jy: U(-2, 2) * s, jth: U(-0.25, 0.25) * s, delay: s > 0 ? 1 : 0 };
      };
      const run2 = (gene, P, rng) => {
        const net = decode(gene, 5, 2), dt = CFG.DT, R = P.R;
        let x = mz.sx + P.jx, y = mz.sy + P.jy, th = Math.PI / 2 + P.jth, bumps = 0, solved = false, len = 0, prev = [0, 0];
        for (let k = 0; k < STEPS; k++) {
          if (inGoal(mz, x, y)) { solved = true; break; }
          const near = mz.near[cellOf(y, mz.n)][cellOf(x, mz.n)], x0 = x, y0 = y, s = new Array(5);
          for (let i = 0; i < 5; i++) {
            let v = senseOne(near, x, y, th + G.angles[i]);
            v = Math.max(v, P.floor[i] + 5.2);
            if (P.sev > 0) { v += P.bias[i] + rng.normal() * (P.sigma + P.prop * v); if (rng() < P.drop) v = CFG.SENSOR_MAX; }
            s[i] = clamp(v, 0, CFG.SENSOR_MAX) / CFG.SENSOR_MAX;
          }
          const out = think(net, s); let cmd = P.delay ? prev : out; prev = out;
          let l = cmd[0], rr = cmd[1];
          if (Math.abs(l) < P.dead) l = 0; if (Math.abs(rr) < P.dead) rr = 0;
          l *= P.gL * (1 + rng.normal() * P.mnoise); rr *= P.gR * (1 + rng.normal() * P.mnoise);
          const V = CFG.V_MAX * P.vScale;
          th += (l - rr) * V / CFG.WHEEL_BASE * dt * P.turnEff + rng.normal() * P.headNoise;
          const v = (l + rr) / 2 * V; x += Math.cos(th) * v * dt; y += Math.sin(th) * v * dt;
          let hit = false;
          for (let it = 0; it < 2; it++) for (const sg of near) {
            const ex = sg.b[0] - sg.a[0], ey = sg.b[1] - sg.a[1];
            let u = ((x - sg.a[0]) * ex + (y - sg.a[1]) * ey) / (ex * ex + ey * ey); u = clamp(u, 0, 1);
            const px = sg.a[0] + ex * u, py = sg.a[1] + ey * u, d = Math.hypot(x - px, y - py);
            if (d < R && d > 1e-9) { x += (x - px) / d * (R - d); y += (y - py) / d * (R - d); hit = true; }
          }
          if (hit) bumps++; len += Math.hypot(x - x0, y - y0);
        }
        if (inGoal(mz, x, y)) solved = true;
        return { solved, bumps, len, dist: Math.hypot(x - mz.gx, y - mz.gy) };
      };
      const fitOf = rs => { let f = 0; for (const q of rs) f += q.solved ? 200 - 0.1 * q.len - 0.2 * q.bumps : -q.dist - 0.2 * q.bumps; return f / rs.length; };
      const rnd = makeRng(777000 + r * 7919);
      let pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => rnd.normal()));
      const K = mode === 'robust' ? 4 : 1, sevTrain = mode === 'robust' ? 1 : 0;
      const trng = makeRng(555000 + r * 31);
      let sc = null;
      for (let g = 0; g <= GENS; g++) {
        sc = pop.map((gene, i) => { const rs = []; for (let k = 0; k < K; k++) rs.push(run2(gene, samplePert(trng, sevTrain), trng)); return { i, f: fitOf(rs) }; }).sort((a, b) => b.f - a.f);
        if (g === GENS) break;
        const parents = sc.slice(0, CFG.POP / 5).map(x => pop[x.i]), next = parents.slice();
        while (next.length < CFG.POP) {
          const a = parents[rnd.int(parents.length)], b2 = parents[rnd.int(parents.length)], cut = 1 + rnd.int(G.geneLen - 1), child = a.slice(0, cut).concat(b2.slice(cut));
          for (let i = 0; i < G.geneLen; i++) if (rnd() < 0.05) child[i] += rnd.normal(0, 0.5);
          next.push(child);
        }
        pop = next;
      }
      // 최종 개체 고르기: 상위 10마리를 새 시험 40번(sev 1)으로 다시 재서 가장 안정적인 한 마리
      const srng = makeRng(999000 + r); let champ = null, champScore = -1e9;
      for (const x of sc.slice(0, 10)) { const rs = []; for (let k = 0; k < 40; k++) rs.push(run2(pop[x.i], samplePert(srng, mode === 'robust' ? 1 : 0), srng)); const sc2 = rs.filter(q => q.solved).length * 1000 + fitOf(rs); if (sc2 > champScore) { champScore = sc2; champ = pop[x.i]; } }
      // 새 시험: 오차 세기별 300번
      const out = { r, mode, gene: champ.map(v => Math.round(v * 1e5) / 1e5) };
      for (const sev of [0, 1, 1.5, 2]) {
        const e = makeRng(123456 + Math.round(sev * 10)); let ok = 0, bm = 0, ln = 0;
        for (let k = 0; k < 300; k++) { const q = run2(champ, samplePert(e, sev), e); if (q.solved) { ok++; ln += q.len; } bm += q.bumps; }
        out['ok_' + sev] = ok; out['bump_' + sev] = Math.round(bm / 300); out['len_' + sev] = ok ? Math.round(ln / ok) : null;
      }
      return out;
    }, { r: t.r, mode: t.mode, GENS, edges });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
