const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('../garage/helpers');

const BUDGET_MS = {
  init: 4000,
  presetSwitch: 100,
  save: 50
};

test('garage init completes within time budget', async ({ page }) => {
  const t0 = Date.now();
  await openGarage(page);
  await waitForShip(page);
  const elapsed = Date.now() - t0;

  expect(elapsed).toBeLessThan(BUDGET_MS.init);
});

test('switching all material presets is within time budget each', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  const presets = ['metallic', 'matte', 'holographic', 'stealth'];

  for (const preset of presets) {
    const elapsed = await page.evaluate((p) => {
      const t0 = performance.now();
      window.GarageRenderer.setMaterialPreset(p);
      return performance.now() - t0;
    }, preset);

    expect(elapsed).toBeLessThan(BUDGET_MS.presetSwitch);
  }
});

test('saveCustomization completes within time budget', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  const elapsed = await page.evaluate(() => {
    window.GarageRenderer.setShipColor(0xff3b3b);
    window.GarageRenderer.setMaterialPreset('stealth');
    const t0 = performance.now();
    window.GarageRenderer.saveCustomization();
    return performance.now() - t0;
  });

  expect(elapsed).toBeLessThan(BUDGET_MS.save);
});
