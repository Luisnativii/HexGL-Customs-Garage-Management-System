const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('material presets apply and respect diffuseMultiplier', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  const result = await page.evaluate(() => {
    window.GarageRenderer.setShipColor(0x808080);
    window.GarageRenderer.setMaterialPreset('stealth');

    const mat = window.GarageRenderer.getShipMesh().material;
    if (mat.uniforms && mat.uniforms.uDiffuseColor) {
      return mat.uniforms.uDiffuseColor.value.getHex();
    }
    return mat.color ? mat.color.getHex() : null;
  });

  const expectedColor = (Math.round(0x80 * 0.13) << 16) |
    (Math.round(0x80 * 0.13) << 8) |
    Math.round(0x80 * 0.13);

  expect(result).toBe(expectedColor);
});
