# Testing plan — Garage

## Tests

### Inicialización y teardown
**Archivo:** `tests/garage/init-teardown.spec.js`
**Qué hace:** abre el garage y luego llama `destroy()`.
**Esperado:** el canvas desaparece del DOM.
**Comando:** `npx playwright test tests/garage/init-teardown.spec.js`

---

### Resize
**Archivo:** `tests/garage/resize.spec.js`
**Qué hace:** abre el garage, registra el tamaño del canvas y abre el panel lateral.
**Esperado:** el canvas cambia de dimensiones al redimensionarse.
**Comando:** `npx playwright test tests/garage/resize.spec.js`

---

### Carga de nave y fallback de material
**Archivo:** `tests/garage/ship-load.spec.js`
**Qué hace:** carga la nave normalmente y en un segundo test anula `createNormalMaterial` antes de abrir el garage.
**Esperado:** `getShipMesh()` y `getShipGroup()` retornan objetos; con shader ausente el material es `MeshPhongMaterial`.
**Comando:** `npx playwright test tests/garage/ship-load.spec.js`

---

### Persistencia de preferencias
**Archivo:** `tests/garage/preferences.spec.js`
**Qué hace:** inyecta preferencias legacy en `localStorage` (con `ship.trail` en vez de `ship.colors.trail`) y en otro test guarda tras cambiar todos los campos.
**Esperado:** el estado interno migra correctamente; `localStorage` contiene body, engine, trail, preset y particle size en formato normalizado.
**Comando:** `npx playwright test tests/garage/preferences.spec.js`

---

### Actualizaciones en tiempo real
**Archivo:** `tests/garage/realtime-updates.spec.js`
**Qué hace:** llama `setShipColor`, `setBoosterColor`, `setTrailColor` y `setTrailSize` y lee el estado y el material de inmediato.
**Esperado:** `getCustomization()` refleja los nuevos valores y el color del material de la nave coincide.
**Comando:** `npx playwright test tests/garage/realtime-updates.spec.js`

---

### Presets de material
**Archivo:** `tests/garage/material-presets.spec.js`
**Qué hace:** aplica el preset `stealth` sobre un color base `0x808080`.
**Esperado:** el color resultante en el material tiene aplicado el `diffuseMultiplier` (0.13) del preset.
**Comando:** `npx playwright test tests/garage/material-presets.spec.js`

---

### Animación holographic
**Archivo:** `tests/garage/holographic.spec.js`
**Qué hace:** activa el preset `holographic`, lee `uAmbientColor`, espera 600 ms y lo vuelve a leer.
**Esperado:** el valor cambia entre lecturas (animación cíclica activa).
**Comando:** `npx playwright test tests/garage/holographic.spec.js`

---

### Integración con UI y juego
**Archivo:** `tests/garage/integration.spec.js`
**Qué hace:** en un test cambia color y trail desde la UI y guarda; en otro inyecta preferencias en `localStorage`, mockea `bkcore.hexgl.HexGL` para evitar cargar assets y dispara el flujo de inicio.
**Esperado:** `localStorage` refleja los cambios de UI; `applyGarageColorsToGame` corre y aplica el color al material del juego.
**Comando:** `npx playwright test tests/garage/integration.spec.js`
