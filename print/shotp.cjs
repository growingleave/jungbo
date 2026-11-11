const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 800, height: 640 }, deviceScaleFactor: 2 }); await pg.goto('file://' + process.argv[2] + '/preview.html'); await pg.screenshot({ path: process.argv[2] + '/preview.png' }); await b.close(); })();
