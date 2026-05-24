const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '../../bkcore/garage/GaragePreferences.js');
const code = fs.readFileSync(SRC, 'utf8');

function makeLocalStorage(initial = {}) {
  const store = Object.assign({}, initial);
  return {
    _store: store,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

function loadModule(localStorage) {
  const ctx = {
    bkcore: { garage: {} },
    window: { localStorage },
    console: { warn: () => {} }
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.bkcore.garage.GaragePreferences;
}

// Test 1 
test('getDefaults returns the expected default structure', () => {
  const prefs = loadModule(makeLocalStorage());
  const d = prefs.getDefaults();

  expect(d.schemaVersion).toBe(1);
  expect(d.ship.colors.body).toBe('#ffffff');
  expect(d.ship.colors.engine).toBe('#00a2ff');
  expect(d.ship.colors.trail).toBe('#ffffff');
  expect(d.ship.material.preset).toBe('metallic');
  expect(d.ship.particles.size).toBe(2);
});

// Test 2
test('load returns defaults when schemaVersion does not match', () => {
  const stored = JSON.stringify({
    schemaVersion: 99,
    ship: { colors: { body: '#ff0000' }, material: { preset: 'matte' }, particles: { size: 3 } }
  });
  const prefs = loadModule(makeLocalStorage({ 'hexgl:userPrefs': stored }));
  const result = prefs.load();

  expect(result.ship.colors.body).toBe('#ffffff');
  expect(result.ship.material.preset).toBe('metallic');
});

// Test 3 
test('load falls back to default only for invalid hex colors, keeping valid ones', () => {
  const stored = JSON.stringify({
    schemaVersion: 1,
    ship: {
      colors: { body: 'not-a-color', engine: '#00ff00', trail: '123456' },
      material: { preset: 'matte' },
      particles: { size: 2 }
    }
  });
  const prefs = loadModule(makeLocalStorage({ 'hexgl:userPrefs': stored }));
  const result = prefs.load();

  expect(result.ship.colors.body).toBe('#ffffff');
  expect(result.ship.colors.engine).toBe('#00ff00');
  expect(result.ship.colors.trail).toBe('#ffffff');
});

// Test 4
test('load migrates legacy ship.trail.size to particles.size when particles is absent', () => {
  const stored = JSON.stringify({
    schemaVersion: 1,
    ship: {
      colors: { body: '#ffffff', engine: '#00a2ff' },
      trail: { color: '#0000ff', size: 3.5 },
      material: { preset: 'metallic' }
    }
  });
  const prefs = loadModule(makeLocalStorage({ 'hexgl:userPrefs': stored }));
  const result = prefs.load();

  expect(result.ship.particles.size).toBe(3.5);
  expect(result.ship.colors.trail).toBe('#0000ff');
});
