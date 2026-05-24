const { test, expect } = require('@playwright/test');
const { openGarage } = require('./helpers');

test('resize updates canvas size', async ({ page }) => {
  await openGarage(page);

  await page.evaluate(() => {
    const canvas = document.querySelector('#garage-viewport canvas');
    window.__canvasSize = { w: canvas.clientWidth, h: canvas.clientHeight };
  });

  await page.click('#garage-toggle-panel');
  await page.waitForSelector('#garage-viewport.panel-open');

  await page.waitForFunction(() => {
    const canvas = document.querySelector('#garage-viewport canvas');
    return canvas && (canvas.clientWidth !== window.__canvasSize.w || canvas.clientHeight !== window.__canvasSize.h);
  });
});
