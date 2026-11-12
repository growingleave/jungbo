// 우승 개체(실제로 쓸 가중치)가 새 미로에서 지나간 길을 기록한다. 오차 없음 1번 + 오차 보통 12번 + 오차 2배 8번. 시뮬레이터 코드는 읽기만 한다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const edges = JSON.parse(fs.readFileSync('maze_real_edges.json', 'utf8'));
const gene = JSON.parse(fs.readFileSync('champion_maze2_25cm_robust_r5.json', 'utf8')).gene;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  const out = await pg.evaluate(({ edges, gene }) => {
    const SEC = 120; profileEl.value = 'real'; CFG = { ...PROFILES.real, N: 4, CELL: 25, TIME_LIMIT: SEC }; STEPS = Math.round(SEC / CFG.DT);
    const n = 4, walls = Array.from({ length: n }, () => Array.from({ length: n }, () => [1, 1, 1, 1]));
    for (const [[x, y], [x2, y2]] of edges) {
      if (x2 === x + 1) { walls[x][y][1] = 0; walls[x2][y2][0] = 0; } else if (x2 === x - 1) { walls[x][y][0] = 0; walls[x2][y2][1] = 0; }
      else if (y2 === y + 1) { walls[x][y][3] = 0; walls[x2][y2][2] = 0; } else { walls[x][y][2] = 0; walls[x2][y2][3] = 0; }
    }
    const mz = { n, walls, start: [0, 0], goal: [n - 1, n - 1] }; mz.shortest = shortestPath(mz); buildGeometry(mz);
    const G = makeGroup(PRESETS.find(p => p.key === 's2')), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const samplePert = (rng, sev) => { const U = (a, b) => a + (b - a) * rng(), s = sev;
      return { sev: s, sigma: 0.8 * s, prop: 0.01 * s, drop: 0.01 * s, bias: Array.from({ length: 5 }, () => clamp(rng.normal() * 1.0 * s, -2.5 * s, 2.5 * s)),
        floor: [3, 3, 6, 3, 3].map(f => f * (s > 0 ? 1 : 0)), gL: 1 + U(-0.15, 0.15) * s, gR: 1 + U(-0.15, 0.15) * s, vScale: 1 - U(0, 0.3) * s,
        dead: U(0, 0.12) * s, mnoise: 0.05 * s, headNoise: 0.01 * s, turnEff: 1 + U(-0.2, 0.2) * s, R: 5.5 + U(0, 1.3) * s,
        jx: U(-2, 2) * s, jy: U(-2, 2) * s, jth: U(-0.25, 0.25) * s, delay: s > 0 ? 1 : 0 }; };
    const run2 = (gene, P, rng) => {
      const net = decode(gene, 5, 2), dt = CFG.DT, R = P.R; let x = mz.sx + P.jx, y = mz.sy + P.jy, th = Math.PI / 2 + P.jth, bumps = 0, solved = false, len = 0, prev = [0, 0], steps = 0;
      const path = [[x, y]];
      for (let k = 0; k < STEPS; k++) {
        if (inGoal(mz, x, y)) { solved = true; break; }
        const near = mz.near[cellOf(y, mz.n)][cellOf(x, mz.n)], x0 = x, y0 = y, s = new Array(5);
        for (let i = 0; i < 5; i++) { let v = senseOne(near, x, y, th + G.angles[i]); v = Math.max(v, P.floor[i] + 5.2);
          if (P.sev > 0) { v += P.bias[i] + rng.normal() * (P.sigma + P.prop * v); if (rng() < P.drop) v = CFG.SENSOR_MAX; } s[i] = clamp(v, 0, CFG.SENSOR_MAX) / CFG.SENSOR_MAX; }
        const o = think(net, s); const cmd = P.delay ? prev : o; prev = o; let l = cmd[0], rr = cmd[1];
        if (Math.abs(l) < P.dead) l = 0; if (Math.abs(rr) < P.dead) rr = 0;
        l *= P.gL * (1 + rng.normal() * P.mnoise); rr *= P.gR * (1 + rng.normal() * P.mnoise);
        const V = CFG.V_MAX * P.vScale; th += (l - rr) * V / CFG.WHEEL_BASE * dt + rng.normal() * P.headNoise; const v = (l + rr) / 2 * V; x += Math.cos(th) * v * dt; y += Math.sin(th) * v * dt;
        let hit = false;
        for (let it = 0; it < 2; it++) for (const sg of near) { const ex = sg.b[0] - sg.a[0], ey = sg.b[1] - sg.a[1];
          let u = ((x - sg.a[0]) * ex + (y - sg.a[1]) * ey) / (ex * ex + ey * ey); u = clamp(u, 0, 1);
          const px = sg.a[0] + ex * u, py = sg.a[1] + ey * u, d = Math.hypot(x - px, y - py); if (d < R && d > 1e-9) { x += (x - px) / d * (R - d); y += (y - py) / d * (R - d); hit = true; } }
        if (hit) bumps++; len += Math.hypot(x - x0, y - y0); steps++; path.push([x, y]);
      }
      if (inGoal(mz, x, y)) solved = true; return { path, solved, bumps, len, sec: steps * dt };
    };
    const res = { segs: mz.segs.map(s => ({ a: s.a, b: s.b, open: s.open })), shortest: mz.shortest };
    const rng0 = makeRng(1); res.nominal = run2(gene, samplePert(rng0, 0), rng0);
    const r1 = makeRng(4242); res.sev1 = Array.from({ length: 12 }, () => run2(gene, samplePert(r1, 1), r1));
    const r2 = makeRng(8484); res.sev2 = Array.from({ length: 8 }, () => run2(gene, samplePert(r2, 2), r2));
    return res;
  }, { edges, gene });
  fs.writeFileSync('real_paths.json', JSON.stringify(out));
  const f = a => a.map(r => ({ ok: r.solved, len: Math.round(r.len), sec: +r.sec.toFixed(1), bumps: r.bumps }));
  console.log('nominal', JSON.stringify(f([out.nominal])), '\nsev1', JSON.stringify(f(out.sev1)), '\nsev2', JSON.stringify(f(out.sev2)));
  await b.close();
})();
