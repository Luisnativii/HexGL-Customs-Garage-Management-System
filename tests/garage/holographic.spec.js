const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('holographic preset animates uniforms over time', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  const colors = await page.evaluate(async () => {
    window.GarageRenderer.setMaterialPreset('holographic');

    function readAmbient() {
      const mat = window.GarageRenderer.getShipMesh().material;
      if (mat.uniforms && mat.uniforms.uAmbientColor) {
        return mat.uniforms.uAmbientColor.value.getHex();
      }
      return null;
    }

    const first = readAmbient();
    await new Promise(resolve => setTimeout(resolve, 600));
    const second = readAmbient();

    return { first, second };
  });

  expect(colors.first).not.toBeNull();
  expect(colors.second).not.toBeNull();
  expect(colors.first).not.toBe(colors.second);
});
