const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); await pg.goto('file:///home/user/jungbo/index.html');
 const r = await pg.evaluate(() => {
  profileEl.value='research'; CFG={...PROFILES.research}; STEPS=Math.round(CFG.TIME_LIMIT/CFG.DT);
  presetEl.value='s12'; maze=makeMaze(10,makeRng(26)); const P=PRESETS.find(p=>p.key==='s12'); GROUPS=[makeGroup(P)]; const G=GROUPS[0];
  const rnd=makeRng(4242); const mazes=Array.from({length:100},(_,k)=>makeMaze(10,makeRng(5000+k)));
  const sh=mazes.map(m=>m.shortest); let ok=0,tot=0;
  for(let i=0;i<100;i++){ const g=Array.from({length:G.geneLen},()=>rnd.normal()); for(const m of mazes){ tot++; if(run(g,m,G).solved) ok++; } }
  return {randomOk:ok,tot,minShort:Math.min(...sh),maxShort:Math.max(...sh),meanShort:sh.reduce((a,c)=>a+c,0)/100};
 }); console.log(JSON.stringify(r)); await b.close(); })();
