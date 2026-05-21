const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('real-time updates reflect ship, booster and trail changes', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  await page.evaluate(() => {
    window.GarageRenderer.setShipColor(0xff0000);
    window.GarageRenderer.setBoosterColor(0x00ff00);
    window.GarageRenderer.setTrailColor(0x0000ff);
    window.GarageRenderer.setTrailSize(3.0);
  });

  const state = await page.evaluate(() => window.GarageRenderer.getCustomization());
  expect(state.shipColor).toBe(0xff0000);
  expect(state.boosterColor).toBe(0x00ff00);
  expect(state.trailColor).toBe(0x0000ff);
  expect(state.trailSize).toBe(3.0);

  const meshColor = await page.evaluate(() => {
    const mat = window.GarageRenderer.getShipMesh().material;
    if (mat.uniforms && mat.uniforms.uDiffuseColor) {
      return mat.uniforms.uDiffuseColor.value.getHex();
    }
    return mat.color ? mat.color.getHex() : null;
  });
  expect(meshColor).toBe(0xff0000);
});
