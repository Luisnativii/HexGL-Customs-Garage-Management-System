const { expect } = require('@playwright/test');

async function openGarage(page) {
  await page.goto('/');
  await page.click('#s-garage');
  await page.waitForSelector('#garage', { state: 'visible' });
  await page.waitForSelector('#garage-viewport canvas');
  await page.waitForFunction(() => {
    return window.GarageRenderer && typeof window.GarageRenderer.getCustomization === 'function';
  });
}

async function waitForShip(page) {
  await page.waitForFunction(() => {
    return window.GarageRenderer &&
      typeof window.GarageRenderer.getShipMesh === 'function' &&
      window.GarageRenderer.getShipMesh();
  });
}

module.exports = { openGarage, waitForShip };
