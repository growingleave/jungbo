const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + process.argv[2] + '/motor.html'); await pg.waitForTimeout(400);
  await pg.pdf({ path: process.argv[2] + '/motor_wiring.pdf', width: '297mm', height: '210mm', printBackground: true });
  await pg.screenshot({ path: process.argv[2] + '/motor_wiring.png' });
  await b.close();
})();
