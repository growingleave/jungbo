const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const edges0 = JSON.parse(fs.readFileSync('maze_real_edges_v3.json', 'utf8'));
const edges = edges0.map(([[a,b],[c,d]]) => [[a,3-b],[c,3-d]]);
const gene = JSON.parse(fs.readFileSync('champion_maze3_bigR_r1.json', 'utf8')).gene;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  const res = await pg.evaluate(({ edges, gene }) => {
      const SEC = 120;
      profileEl.value = 'real'; CFG = { ...PROFILES.real, N: 4, TIME_LIMIT: SEC }; STEPS = Math.round(SEC / CFG.DT);
      const n = 4, walls = Array.from({ length: n }, () => Array.from({ length: n }, () => [1, 1, 1, 1]));
      for (const [[x, y], [x2, y2]] of edges) {
        if (x2 === x + 1) { walls[x][y][1] = 0; walls[x2][y2][0] = 0; } else if (x2 === x - 1) { walls[x][y][0] = 0; walls[x2][y2][1] = 0; }
        else if (y2 === y + 1) { walls[x][y][3] = 0; walls[x2][y2][2] = 0; } else { walls[x][y][2] = 0; walls[x2][y2][3] = 0; }
      }
      const mz = { n, walls, start: [0, n - 1], goal: [n - 1, 0] }; mz.shortest = shortestPath(mz); buildGeometry(mz);
      const G = makeGroup(PRESETS.find(p => p.key === 's2')), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const samplePert = (rng, sev) => {
        const U = (a, b) => a + (b - a) * rng(), s = sev;
        return { sev: s, sigma: 0.8 * s, prop: 0.01 * s, drop: 0.01 * s,
          bias: Array.from({ length: 5 }, () => clamp(rng.normal() * 1.0 * s, -2.5 * s, 2.5 * s)),
          floor: [3, 3, 6, 3, 3].map(f => f * (s > 0 ? 1 : 0)),            // 가까이서 못 읽는 거리(cm): 앞 센서(파손)는 6, 나머지 3
          gL: 1 + U(-0.15, 0.15) * s, gR: 1 + U(-0.15, 0.15) * s, vScale: 1 - U(0, 0.3) * s,
          dead: U(0, 0.12) * s, mnoise: 0.05 * s, headNoise: 0.01 * s, turnEff: 1 + U(-0.2, 0.2) * s,
          R: 6.5 + U(0, 1.5) * s, jx: U(-2, 2) * s, jy: U(-2, 2) * s, jth: U(-0.25, 0.25) * s, delay: s > 0 ? 1 : 0 };
      };
      const run2 = (gene, P, rng, hand, base) => {
        const net = decode(gene, 5, 2), dt = CFG.DT, R = P.R;
        let backN = 0, backLeft = false; let x = mz.sx + P.jx, y = mz.sy + P.jy, th = Math.PI / 2 + P.jth, bumps = 0, solved = false, len = 0, prev = [0, 0];
        for (let k = 0; k < STEPS; k++) {
          if (inGoal(mz, x, y)) { solved = true; break; }
          const near = mz.near[cellOf(y, mz.n)][cellOf(x, mz.n)], x0 = x, y0 = y, s = new Array(5);
          for (let i = 0; i < 5; i++) {
            let v = senseOne(near, x, y, th + G.angles[i]);
            v = Math.max(v, P.floor[i] + 5.2);
            if (P.sev > 0) { v += P.bias[i] + rng.normal() * (P.sigma + P.prop * v); if (rng() < P.drop) v = CFG.SENSOR_MAX; }
            s[i] = clamp(v, 0, CFG.SENSOR_MAX) / CFG.SENSOR_MAX;
          }
          let out;
          { const mmv = s.map(v => (v * CFG.SENSOR_MAX - 5.2) * 10);
          if (backN === 0 && (mmv[2] <= 70 || mmv[1] <= 55 || mmv[3] <= 55)) { backN = 9; backLeft = (mmv[2] <= 70) ? (mmv[0] + mmv[1] > mmv[3] + mmv[4]) : (mmv[1] > mmv[3]); }
          if (backN > 0) { out = backN === 1 ? [0, 0] : (backLeft ? [-0.9, -0.5] : [-0.5, -0.9]); backN--; }
          else {
            const L = hand === 'L', near = L ? mmv[0] : mmv[4], near45 = L ? mmv[1] : mmv[3], F = mmv[2];
            if (F < 105) out = L ? [0.6, -0.6] : [-0.6, 0.6];
            else if (near45 > 230 && near > 200) out = (L ? [0.15, 0.7] : [0.7, 0.15]).map(v => v * base / 0.6);
            else { const err = clamp((near - 75) / 100, -1, 1), c = 0.5 * err; out = L ? [base - c, base + c] : [base + c, base - c]; }
          } }
          let cmd = P.delay ? prev : out; prev = out;
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

      const res = {};
      for (const hand of ['L', 'R']) for (const base of [0.6, 0.4]) {
        const key = hand + base; res[key] = {};
        for (const sev of [0, 1, 2]) {
          const e = makeRng(123456 + Math.round(sev * 10)); let ok = 0, bm = 0, ln = 0, tm = 0;
          for (let k = 0; k < 200; k++) { const q = run2(gene, samplePert(e, sev), e, hand, base); if (q.solved) { ok++; ln += q.len; tm += q.sec; } bm += q.bumps; }
          res[key][sev] = { ok, bump: Math.round(bm / 200), len: ok ? Math.round(ln / ok) : null, sec: ok ? Math.round(tm / ok) : null };
        }
      }
      return res;
  }, { edges, gene });
  for (const k of Object.keys(res)) console.log(k, JSON.stringify(res[k]));
  await b.close();
})();
