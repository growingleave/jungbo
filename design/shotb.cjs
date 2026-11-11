const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + process.argv[2] + '/body.html'); await pg.waitForTimeout(500);
  await pg.pdf({ path: process.argv[2] + '/body_plan.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  const n = await pg.locator('.pg').count();
  for (let i = 0; i < n; i++) await pg.locator('.pg').nth(i).screenshot({ path: process.argv[2] + `/bp${i + 1}.png` });
  await b.close();
})();
