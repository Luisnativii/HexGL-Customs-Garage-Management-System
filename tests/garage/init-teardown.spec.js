const { test, expect } = require('@playwright/test');
const { openGarage } = require('./helpers');

test('init and destroy', async ({ page }) => {
  await openGarage(page);
  await expect(page.locator('#garage-viewport canvas')).toHaveCount(1);

  await page.evaluate(() => window.GarageRenderer.destroy());
  await expect(page.locator('#garage-viewport canvas')).toHaveCount(0);
});
