const { test, expect } = require('@playwright/test');
const { openGarage, waitForShip } = require('./helpers');

test('ui controls update state and save preferences', async ({ page }) => {
  await openGarage(page);
  await waitForShip(page);

  await page.click('#garage-toggle-panel');
  await page.waitForSelector('#garage-panel.open');

  await page.click('#ship-color-grid .color-swatch[data-color="0xff3b3b"]');

  await page.evaluate(() => {
    const trailSize = document.getElementById('trail-size');
    trailSize.value = '3.0';
    trailSize.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.click('#garage-save');

  const stored = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('hexgl:userPrefs'));
  });

  expect(stored.ship.colors.body).toBe('#ff3b3b');
  expect(stored.ship.particles.size).toBe(3);
});

test('launch.js applies saved preferences to game ship', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hexgl:userPrefs', JSON.stringify({
      schemaVersion: 1,
      lastUpdated: '2026-05-20T00:00:00.000Z',
      ship: {
        colors: { body: '#ff0000', engine: '#00ff00', trail: '#0000ff' },
        material: { preset: 'matte' },
        particles: { size: 2.5 }
      }
    }));
  });

  await page.click('#start');
  await page.waitForSelector('#step-2', { state: 'visible' });

  // Mock HexGL before step-2 triggers init(), so load() fires onLoad immediately
  // without waiting for 3D assets, and exposes the ship material for assertion.
  await page.evaluate(() => {
    const shipMat = new THREE.MeshPhongMaterial();
    window.__testShipMat = shipMat;
    bkcore.hexgl.HexGL = function() {
      this.track = { materials: { ship: shipMat } };
      this.components = { shipControls: null, shipEffects: null };
      this.init = function() {};
      this.start = function() {};
      this.update = function() {};
      this.load = function(cbs) { if (cbs && cbs.onLoad) cbs.onLoad(); return this; };
    };
  });

  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.click('#step-2');
  await page.waitForFunction(() => window.hexGL);

  expect(logs.some(l => l.includes('launch.js: Applying garage customization'))).toBe(true);

  const bodyColor = await page.evaluate(() => window.__testShipMat.color.getHex());
  expect(bodyColor).toBe(0xff0000);
});
