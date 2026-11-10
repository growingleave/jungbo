const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 862, height: 794 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + process.argv[2] + '/power.html'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: process.argv[2] + '/power.png' });
  await b.close();
})();
