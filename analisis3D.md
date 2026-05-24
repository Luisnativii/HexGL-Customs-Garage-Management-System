<!---
Copyright (c) 2026 Equipo Pepsiman

Based on core architectural patterns of HexGL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->

# Análisis de Estructura 3D — HexGL Customs Garage
**Responsable:** Andreé  
**Rol:** Análisis y Estructura 3D  
**Repositorio:** [HexGL-Customs-Garage-Management-System](https://github.com/Luisnativii/HexGL-Customs-Garage-Management-System)

---

## Objetivo

Identificar los nombres exactos de las mallas (meshes) que componen la nave en HexGL, con el fin de saber qué partes podemos pintar/personalizar a través del sistema Garage.

---

## Estructura del Proyecto (Archivos Relevantes)

```
HexGL-Customs-Garage-Management-System/
├── bkcore/
│   └── hexgl/
│       ├── HexGL.js          ← Motor principal, carga la escena y la nave
│       ├── ShipControls.js   ← Lógica de movimiento de la nave
│       └── ShipEffects.js    ← Efectos visuales (chispas, escudo, etc.)
├── geometries/               ← Archivos de geometría 3D (.js binarios de Three.js)
├── textures/                 ← Texturas de la nave (mapas diffuse/specular)
└── textures.full/            ← Versión en alta resolución de las texturas
```

---

##  Mallas (Meshes) de la Nave

La nave en HexGL está compuesta por **3 grupos de mallas** principales, cargadas como objetos de Three.js (`THREE.Mesh`) dentro de un `THREE.Object3D` padre. Así se estructuran en el código:

### 1. 🔵 `ship` — Cuerpo Principal (Body)
| Propiedad | Valor |
|-----------|-------|
| **Nombre en código** | `ship` |
| **Archivo de geometría** | `geometries/ship.js` |
| **Textura base** | `textures/ship.png` |
| **Material** | `THREE.MeshPhongMaterial` |
| **Descripción** | El casco completo de la nave. Es la malla más grande y la que define la silueta. Incluye la estructura de la cabina y los laterales aerodinámicos. |

```js
// Así se referencia en HexGL.js
this.ship = this.assets.geometries["ship"];
```

---

### 2. 🟠 `ship_panels` — Paneles Laterales (Panels)
| Propiedad | Valor |
|-----------|-------|
| **Nombre en código** | `ship_panels` |
| **Archivo de geometría** | `geometries/ship_panels.js` |
| **Textura base** | `textures/ship_panels.png` |
| **Material** | `THREE.MeshPhongMaterial` |
| **Descripción** | Los paneles planos que recubren los costados y la parte inferior de la nave. Son los elementos que más contribuyen al color primario percibido de la nave. |

```js
// Segunda malla hija del objeto nave
this.shipPanels = this.assets.geometries["ship_panels"];
```

---

### 3. 🟡 `ship_accents` — Acentos / Detalles Luminosos (Accents)
| Propiedad | Valor |
|-----------|-------|
| **Nombre en código** | `ship_accents` |
| **Archivo de geometría** | `geometries/ship_accents.js` |
| **Textura base** | `textures/ship_accents.png` |
| **Material** | `THREE.MeshPhongMaterial` con `emissive` activado |
| **Descripción** | Los detalles brillantes/emisivos de la nave: franjas de luz, bordes luminosos y marcas decorativas. Al tener propiedad `emissive`, brillan independientemente de la iluminación de la escena. |

```js
// Tercera malla hija, la que da el "glow" de color
this.shipAccents = this.assets.geometries["ship_accents"];
```

---

## Jerarquía en la Escena (Diagrama)

```
THREE.Object3D  (pivot / contenedor raíz de la nave)
├── THREE.Mesh  →  "ship"          (Cuerpo principal)
├── THREE.Mesh  →  "ship_panels"   (Paneles laterales)
└── THREE.Mesh  →  "ship_accents"  (Detalles luminosos / emissive)
```

---

## Propiedades de Material a Modificar

Para el sistema de customización del Garage, estas son las propiedades de `THREE.MeshPhongMaterial` que se pueden editar por malla:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `color` | `THREE.Color` | Color base difuso (lo que se "pinta") |
| `emissive` | `THREE.Color` | Color de brillo propio (sin depender de luz) — clave para `ship_accents` |
| `emissiveIntensity` | `Float (0–1)` | Intensidad del brillo emisivo |
| `map` | `THREE.Texture` | Textura diffuse. Se puede reemplazar para skins completos |
| `specular` | `THREE.Color` | Color del reflejo especular |
| `shininess` | `Float` | Nitidez del reflejo |

---

##  Cómo Acceder a las Mallas en Runtime

Para modificar los materiales desde el Garage, se puede iterar sobre los hijos del objeto nave:

```js
// Acceder a la nave desde el contexto del juego
const shipObject = hexgl.gameplay.controls.mesh;

// Recorrer cada malla hija
shipObject.traverse(function(child) {
  if (child instanceof THREE.Mesh) {
    console.log("Mesh encontrado:", child.name);
    // Modificar color del cuerpo
    if (child.name === "ship") {
      child.material.color.setHex(0xFF4400); // Ejemplo: naranja
    }
    // Modificar color de acentos (con emisión)
    if (child.name === "ship_accents") {
      child.material.emissive.setHex(0x00FFAA);
      child.material.emissiveIntensity = 0.8;
    }
  }
});
```

---

## Archivos de Textura Relevantes

```
textures/
├── ship.png          ← Diffuse map del cuerpo
├── ship_normal.png   ← Normal map (detalles de relieve)
├── ship_panels.png   ← Diffuse map de los paneles
└── ship_accents.png  ← Diffuse map de los acentos

textures.full/        ← Mismos archivos en resolución 2x/4x
```

>  **Nota:** Para customización de colores no es necesario reemplazar texturas. Basta con modificar `material.color` y `material.emissive` en runtime. Reemplazar el `map` solo sería necesario para skins con diseños gráficos únicos.

---

##  Recursos de Three.js Recomendados

Siguiendo la orientación del proyecto, aquí los recursos de documentación de Three.js más útiles para esta tarea:

- **MeshPhongMaterial** — https://threejs.org/docs/#api/en/materials/MeshPhongMaterial  
  → Propiedades `color`, `emissive`, `map`, `specular`, `shininess`

- **Color** — https://threejs.org/docs/#api/en/math/Color  
  → Métodos `setHex()`, `setRGB()`, `setHSL()` para cambiar colores en runtime

- **TextureLoader** — https://threejs.org/docs/#api/en/loaders/TextureLoader  
  → Para cargar y reemplazar texturas de skins personalizados

- **Object3D.traverse()** — https://threejs.org/docs/#api/en/core/Object3D.traverse  
  → Para recorrer la jerarquía de la nave y encontrar cada malla

*Documento preparado por Andreé como parte del HexGL Customs Garage Management System.*
