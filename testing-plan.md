# Plan de testing para la creación del garage

Este documento define qué se debe probar en la nueva funcionalidad del garage, por qué cada caso existe y cómo validarlo. No implementa pruebas todavía; solo fija el alcance para que luego puedan convertirse en tests unitarios, de integración y validaciones manuales.

## 1. Alcance analizado

La creación del garage quedó repartida principalmente entre estos cambios:

- `garage-renderer.js`: inicialización de la escena 3D, carga del modelo, iluminación, preview en tiempo real, colores, material presets, partículas, resize y limpieza.
- `bkcore/garage/GaragePreferences.js`: persistencia y normalización de preferencias.
- `bkcore/garage/GarageMaterialPresets.js`: aplicación de presets visuales sobre materiales Three.js.
- `launch.js`: lectura de preferencias del garage y aplicación al juego principal.
- `index.html`: estructura de la interfaz del garage y controles de personalización.

La hipótesis de comportamiento que hay que validar es esta: el garage debe inicializarse sin romper el flujo principal, cargar preferencias válidas, aplicar cambios visuales en tiempo real y mantener consistencia entre lo que se ve en el garage y lo que se usa después en el juego.

## 2. Objetivos de prueba

1. Verificar que el garage se crea y destruye correctamente.
2. Verificar que las preferencias se leen, normalizan y guardan sin perder compatibilidad con datos antiguos.
3. Verificar que los cambios de color, trail y preset se reflejan en la escena 3D en tiempo real.
4. Verificar que el juego principal recibe las preferencias del garage de forma consistente.
5. Verificar que los fallos por dependencias ausentes no rompan la app y queden en modo degradado.

## 3. Casos de prueba propuestos

### 3.1 Inicialización del garage

- Caso: `init(containerElement)` crea escena, cámara, renderer y controles.
- Qué valida: que el contenedor recibe el canvas y que se registran controles y resize.
- Cómo probarlo: montar un contenedor con tamaño válido y llamar `GarageRenderer.init(...)` con dependencias cargadas.
- Resultado esperado: el canvas queda dentro del contenedor, la cámara se posiciona, OrbitControls queda activo y el garage entra en render loop.

- Caso: `init(containerElement)` usa tamaños de respaldo cuando el contenedor no tiene dimensiones.
- Qué valida: robustez ante layout incompleto o contenedor oculto.
- Cómo probarlo: pasar un contenedor con `clientWidth/clientHeight` en cero.
- Resultado esperado: el renderer toma dimensiones derivadas de `window.innerWidth/innerHeight` sin lanzar errores.

### 3.2 Carga de modelo y escena base

- Caso: `loadShipModel()` carga la geometría del Feisar y la agrega a la escena.
- Qué valida: que la nave aparece como grupo, mesh y referencia accesible.
- Cómo probarlo: simular carga exitosa del JSONLoader y verificar que `getShipMesh()` y `getShipGroup()` devuelven objetos.
- Resultado esperado: la nave se agrega al scene graph y el estado visual se actualiza.

- Caso: fallback de material cuando no existe `bkcore.Utils.createNormalMaterial`.
- Qué valida: compatibilidad con entornos incompletos o sin shader custom.
- Cómo probarlo: forzar ausencia de `bkcore.Utils.createNormalMaterial`.
- Resultado esperado: se usa `MeshPhongMaterial` y la carga no falla.

### 3.3 Persistencia de preferencias

- Caso: `loadCustomization()` recupera preferencias válidas.
- Qué valida: lectura desde `GaragePreferences` y conversión a estado interno.
- Cómo probarlo: guardar un objeto válido en localStorage y cargar el garage.
- Resultado esperado: `customization.shipColor`, `customization.boosterColor`, `garageTrailColor`, `garageTrailSize` y `garageMaterialPreset` se sincronizan con lo guardado.

- Caso: `loadCustomization()` maneja preferencias antiguas.
- Qué valida: compatibilidad con `ship.trail.color` y `ship.trail.size`.
- Cómo probarlo: guardar datos con esquema legacy y cargar el garage.
- Resultado esperado: los valores legacy se migran lógicamente sin romper la carga.

- Caso: `saveCustomization()` persiste el estado actual.
- Qué valida: que el estado visual real se convierte en estructura persistible.
- Cómo probarlo: cambiar colores/preset/tamaño y ejecutar guardado.
- Resultado esperado: `GaragePreferences.save(...)` recibe body, engine, trail, preset y particle size con formato normalizado.

### 3.4 Colores en tiempo real

- Caso: `setShipColor()` y `applyShipColor()` actualizan el color de la nave.
- Qué valida: preview inmediato para `ShaderMaterial` y `MeshPhongMaterial`.
- Cómo probarlo: invocar el setter con colores conocidos y observar el material aplicado.
- Resultado esperado: el cuerpo de la nave cambia sin recargar la escena.

- Caso: `setBoosterColor()` y `applyBoosterColor()` actualizan la luz inferior.
- Qué valida: sincronización visual del booster glow.
- Cómo probarlo: cambiar el color de booster y revisar el `PointLight` asociado.
- Resultado esperado: la luz cambia de color en la misma ejecución.

- Caso: `setTrailColor()` actualiza el preview de partículas.
- Qué valida: que el color del trail se refleja en ambas emisoras.
- Cómo probarlo: cambiar el trail color con el preview ya creado.
- Resultado esperado: left y right trails quedan tintados con el mismo valor.

- Caso: `setTrailSize()` actualiza el tamaño de partículas.
- Qué valida: que el tamaño visual se ajusta en ambos lados del ship.
- Cómo probarlo: cambiar el tamaño desde la UI o invocación directa.
- Resultado esperado: `setSize(size * 1.5)` se aplica en ambos emisores.

### 3.5 Presets de material

- Caso: `setMaterialPreset()` aplica un preset válido.
- Qué valida: que el preset se guarda en estado y se aplica sobre el material existente.
- Cómo probarlo: alternar entre `metallic`, `matte`, `holographic` y `stealth`.
- Resultado esperado: cambian shininess, reflectivity, specular y ambient según el preset.

- Caso: `applyShipColor()` respeta el `diffuseMultiplier` del preset.
- Qué valida: el efecto visual especial de `stealth` y su recuperación cuando cambia el preset.
- Cómo probarlo: usar color base distinto de blanco y aplicar `stealth`.
- Resultado esperado: el color se oscurece de forma proporcional y luego se restaura si cambia el preset.

- Caso: el modo `holographic` modifica la nave durante `animate()`.
- Qué valida: animación cíclica con cambios de color en uniforms.
- Cómo probarlo: fijar el preset holográfico y observar varios frames.
- Resultado esperado: ambient, specular y diffuse cambian de forma gradual en el tiempo.

### 3.6 Resize y limpieza

- Caso: `onWindowResize()` recalcula cámara y tamaño del renderer.
- Qué valida: respuesta correcta al cambio de viewport.
- Cómo probarlo: cambiar el tamaño del contenedor o de la ventana y disparar resize.
- Resultado esperado: la cámara mantiene proporción y el canvas se redimensiona.

- Caso: `destroy()` libera recursos y escucha de eventos.
- Qué valida: que no quedan animaciones ni listeners colgados.
- Cómo probarlo: crear el garage y luego destruirlo.
- Resultado esperado: se cancela `requestAnimationFrame`, se retira el canvas y se elimina el listener de resize.

### 3.7 Integración con el juego

- Caso: `launch.js` lee preferencias del garage y las aplica al juego.
- Qué valida: que lo elegido en el garage se reutiliza en la carrera.
- Cómo probarlo: guardar preferencias y luego entrar al flujo principal.
- Resultado esperado: body color, booster color, trail color y size quedan reflejados en la nave del juego.

- Caso: la pantalla del garage en `index.html` expone controles funcionales.
- Qué valida: que los botones y paneles necesarios existen y están conectados al renderer.
- Cómo probarlo: abrir la vista del garage y validar interacción básica de botones y swatches.
- Resultado esperado: el panel responde y dispara las acciones esperadas.


## 4. Criterios de aceptación

- El garage puede abrirse y cerrarse sin errores.
- Los cambios visuales se ven en pantalla sin recargar.
- Lo guardado persiste entre sesiones.
- Los valores legacy no rompen la carga.
- El juego principal reutiliza las preferencias del garage.

## 5. Notas de cobertura

- Si se automatizan pruebas, hay que mockear `localStorage`, `requestAnimationFrame`, `THREE.*` y `JSONLoader`.
- Si se hacen pruebas manuales, conviene revisar en navegador el estado inicial, el cambio de color, el preset material, el trail y el regreso al menú.
- La validación más crítica no es solo que el garage se vea bien, sino que el estado persistido sea el mismo que luego consume `launch.js`.