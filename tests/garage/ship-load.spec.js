const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('loads ship model and exposes getters', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  const hasMeshAndGroup = await page.evaluate(() => {
    return !!(window.GarageRenderer.getShipMesh() && window.GarageRenderer.getShipGroup());
  });

  expect(hasMeshAndGroup).toBe(true);
});

test('falls back to MeshPhongMaterial when shader util is missing', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.bkcore && window.bkcore.Utils);
  await page.evaluate(() => {
    if (window.bkcore && window.bkcore.Utils) {
      window.bkcore.Utils.createNormalMaterial = null;
    }
  });

  await page.click('#s-garage');
  await page.waitForSelector('#garage-viewport canvas');
  await waitForShip(page);

  const hasPhong = await page.evaluate(() => {
    const mesh = window.GarageRenderer.getShipMesh();
    const mat = mesh ? mesh.material : null;
    if (!mat) return false;
    if (mat instanceof THREE.MeshPhongMaterial) return true;
    if (mat.materials && mat.materials.length) {
      return mat.materials.some((child) => child instanceof THREE.MeshPhongMaterial);
    }
    return false;
  });

  expect(hasPhong).toBe(true);
});
