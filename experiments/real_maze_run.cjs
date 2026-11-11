// 실제 로봇용 4x4 미로(maze_real.png)를 시뮬레이터에 넣고, 한 세대 시간을 길게(시간 압박 없이) 해서 학습한다. 시뮬레이터 코드는 읽기만 한다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, wi, nw, gens, sec, outFile] = process.argv;
const W = Number(wi), NW = Number(nw), GENS = Number(gens), SEC = Number(sec);
const edges = JSON.parse(fs.readFileSync('maze_real_edges.json', 'utf8'));
const tasks = []; for (let r = 0; r < 8; r++) tasks.push({ r });
const mine = tasks.filter((_, i) => i % NW === W);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file:///home/user/jungbo/index.html');
  for (const t of mine) {
    const t0 = Date.now();
    const res = await pg.evaluate(({ r, GENS, SEC, edges }) => {
      profileEl.value = 'real'; CFG = { ...PROFILES.real, N: 4, TIME_LIMIT: SEC }; STEPS = Math.round(CFG.TIME_LIMIT / CFG.DT);
      const n = 4, walls = Array.from({ length: n }, () => Array.from({ length: n }, () => [1, 1, 1, 1]));
      for (const [[x, y], [x2, y2]] of edges) {           // 그림 좌표(x 오른쪽, y 위) -> 시뮬레이터(행=x, 열=y): 입구 방향이 아래쪽이 되도록 돌림
        const r1 = x, c1 = y, r2 = x2, c2 = y2;
        if (r2 === r1 + 1) { walls[r1][c1][1] = 0; walls[r2][c2][0] = 0; }
        else if (r2 === r1 - 1) { walls[r1][c1][0] = 0; walls[r2][c2][1] = 0; }
        else if (c2 === c1 + 1) { walls[r1][c1][3] = 0; walls[r2][c2][2] = 0; }
        else { walls[r1][c1][2] = 0; walls[r2][c2][3] = 0; }
      }
      maze = { n, walls, start: [0, 0], goal: [n - 1, n - 1] };
      maze.shortest = shortestPath(maze); buildGeometry(maze);
      presetEl.value = 's12';
      const P = PRESETS.find(p => p.key === 's12'); GROUPS = [makeGroup(P)]; const G = GROUPS[0];
      G.rnd = makeRng(777000 + r * 7919 + 67 * 31);
      G.pop = Array.from({ length: CFG.POP }, () => Array.from({ length: G.geneLen }, () => G.rnd.normal()));
      G.hist = []; gen = 0; beginGeneration();
      let first = null;
      for (let g = 0; g <= GENS; g++) { if (first === null && G.runs.some(x => x.solved)) first = g; if (g < GENS) breed(); }
      const solved = G.runs.filter(x => x.solved);
      const bestLen = solved.length ? Math.min(...solved.map(x => x.len)) : null;
      return { r, shortest: maze.shortest, first, finalSolved: solved.length, bestLen };
    }, { r: t.r, GENS, SEC, edges });
    res.sec = Math.round((Date.now() - t0) / 1000);
    fs.appendFileSync(outFile, JSON.stringify(res) + '\n');
  }
  await b.close();
})();
