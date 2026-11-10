const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + process.argv[2] + '/sensor_test.html'); await pg.waitForTimeout(400);
  await pg.pdf({ path: process.argv[2] + '/sensor_test.pdf', width: '297mm', height: '210mm', printBackground: true });
  await pg.screenshot({ path: process.argv[2] + '/sensor_test.png' });
  await b.close();
})();
