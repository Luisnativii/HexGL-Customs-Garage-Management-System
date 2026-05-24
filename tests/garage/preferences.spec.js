const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('loads preferences including legacy trail data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hexgl:userPrefs', JSON.stringify({
      schemaVersion: 1,
      lastUpdated: '2026-05-20T00:00:00.000Z',
      ship: {
        colors: { body: '#ff0000', engine: '#00ff00' },
        trail: { color: '#0000ff', size: 3 },
        material: { preset: 'matte' }
      }
    }));
  });

  await page.click('#s-garage');
  await waitForShip(page);

  const state = await page.evaluate(() => window.GarageRenderer.getCustomization());
  expect(state.shipColor).toBe(0xff0000);
  expect(state.boosterColor).toBe(0x00ff00);
  expect(state.trailColor).toBe(0x0000ff);
  expect(state.trailSize).toBe(3);
  expect(state.materialPreset).toBe('matte');
});

test('saveCustomization persists body, engine, trail, preset and particle size', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  await page.evaluate(() => {
    window.GarageRenderer.setShipColor(0xff0000);
    window.GarageRenderer.setBoosterColor(0x00ff00);
    window.GarageRenderer.setTrailColor(0x0000ff);
    window.GarageRenderer.setTrailSize(2.5);
    window.GarageRenderer.setMaterialPreset('matte');
  });

  const saved = await page.evaluate(() => {
    window.GarageRenderer.saveCustomization();
    return JSON.parse(localStorage.getItem('hexgl:userPrefs'));
  });

  expect(saved.ship.colors.body).toBe('#ff0000');
  expect(saved.ship.colors.engine).toBe('#00ff00');
  expect(saved.ship.colors.trail).toBe('#0000ff');
  expect(saved.ship.material.preset).toBe('matte');
  expect(saved.ship.particles.size).toBe(2.5);
});
