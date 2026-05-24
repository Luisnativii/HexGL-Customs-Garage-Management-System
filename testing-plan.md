# Plan de pruebas — Garage

---

## Pruebas E2E (Playwright)

Estas pruebas abren el navegador, cargan la aplicación y verifican el comportamiento desde el punto de vista del usuario o del sistema completo.

### Inicialización y teardown

**Archivo:** `tests/garage/init-teardown.spec.js`

Abre el garage y luego lo destruye llamando a `destroy()`. Verifica que el canvas desaparece del DOM correctamente.

---

### Resize

**Archivo:** `tests/garage/resize.spec.js`

Abre el garage, registra el tamaño inicial del canvas y luego abre el panel lateral. Verifica que el canvas cambia de dimensiones al redimensionarse.

---

### Carga de nave y fallback de material

**Archivo:** `tests/garage/ship-load.spec.js`

Verifica dos casos: que la nave carga correctamente exponiendo `getShipMesh()` y `getShipGroup()`, y que cuando el shader personalizado no está disponible el material cae a `MeshPhongMaterial`.

---

### Persistencia de preferencias

**Archivo:** `tests/garage/preferences.spec.js`

Verifica que las preferencias guardadas en `localStorage` se leen y aplican al abrir el garage, incluyendo datos en formato antiguo (`ship.trail`). También verifica que al guardar, todos los campos quedan correctamente en `localStorage`.

---

### Actualizaciones en tiempo real

**Archivo:** `tests/garage/realtime-updates.spec.js`

Cambia color de nave, motor, trail y tamaño de partículas. Verifica que `getCustomization()` refleja los nuevos valores y que el material de la nave en pantalla actualiza su color.

---

### Presets de material

**Archivo:** `tests/garage/material-presets.spec.js`

Aplica el preset `stealth` sobre un color base gris (`0x808080`). Verifica que el color resultante en el material tiene aplicado el multiplicador de difusión del preset (0.13).

---

### Animación holographic

**Archivo:** `tests/garage/holographic.spec.js`

Activa el preset `holographic`, lee el valor de `uAmbientColor`, espera 600 ms y lo vuelve a leer. Verifica que el valor cambió, lo que indica que la animación cíclica está activa.

---

### Integración con UI y juego

**Archivo:** `tests/garage/integration.spec.js`

Verifica dos flujos: que los controles de la UI actualizan el estado y lo persisten en `localStorage`, y que al iniciar el juego las preferencias guardadas se aplican al material de la nave.

---

## Pruebas unitarias (Jest)

Estas pruebas verifican funciones individuales directamente en Node.js, sin navegador.

### Valores por defecto

**Archivo:** `tests/unit/garage-preferences.test.js`

Llama a `getDefaults()` y verifica que la estructura retornada tiene los valores correctos: version de esquema, colores iniciales, preset y tamaño de partículas.

---

### Rechazo de schemaVersion inválido

**Archivo:** `tests/unit/garage-preferences.test.js`

Guarda preferencias con un `schemaVersion` desconocido (99) y llama a `load()`. Verifica que se devuelven los valores por defecto en lugar de los datos guardados.

---

### Fallback por color inválido

**Archivo:** `tests/unit/garage-preferences.test.js`

Guarda preferencias con colores en formato incorrecto (uno válido, dos inválidos). Verifica que los campos inválidos se reemplazan por el valor por defecto y el válido se conserva.

---

### Migración de datos legacy

**Archivo:** `tests/unit/garage-preferences.test.js`

Guarda preferencias en formato antiguo, donde el color y tamaño del trail estaban bajo `ship.trail` en lugar de `ship.colors.trail` y `ship.particles.size`. Verifica que `load()` migra esos valores al formato actual.

---

## Prueba de rendimiento (Playwright)

Esta prueba verifica que las operaciones del garage responden dentro de tiempos aceptables.

### Tiempos de operación del garage

**Archivo:** `tests/performance/garage-perf.spec.js`

Mide tres operaciones:

- Cuánto tarda en abrirse el garage y cargar la nave (límite: 4000 ms).
- Cuánto tarda en aplicarse cada preset de material (límite: 100 ms por preset).
- Cuánto tarda en ejecutarse `saveCustomization()` (límite: 50 ms).

---

## Comandos

```bash
# E2E (corre todas las pruebas de tests/garage/)
npm run test:garage

# Unitarias
npm run test:unit

# Rendimiento
npm run test:performance
```
