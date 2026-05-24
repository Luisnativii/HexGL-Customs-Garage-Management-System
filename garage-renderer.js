/*
 * Copyright (c) 2026 Equipo Pepsiman
 *
 * Based on core architectural patterns of HexGL
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Garage 3D Renderer for Three.js r53 (HexGL project)
// Loads the Feisar ship model with textures and enables OrbitControls for rotation.
// Includes color customization with real-time preview.

(function() {
  var garageScene, garageCamera, garageRenderer, garageAnimId, garageMesh;
  var garageOrbitControls = null;
  var garageShipGroup = null;
  var garageBoosterLight = null;
  var garageTrailParticles = null;
  var garageTrailColor = 0xffffff;
  var garageTrailSize = 2;
  var garageMaterialPreset = 'metallic';
  var garageRainbowTime = 0;

  function hslToHex(h, s, l) {
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
  }

  function getGaragePreferences()
  {
    return bkcore && bkcore.garage && bkcore.garage.GaragePreferences
      ? bkcore.garage.GaragePreferences
      : null;
  }

  function colorNumberToHexString(hexColor)
  {
    return '#' + ('000000' + hexColor.toString(16)).slice(-6).toLowerCase();
  }

  function hexStringToColorNumber(hexColor)
  {
    return parseInt(hexColor.replace('#', ''), 16);
  }

  function applyPrefsToCustomization(prefs)
  {
    // Carga el estado normalizado desde GaragePreferences antes de crear
    // mallas/particulas, asi la primera pintura ya sale con los valores guardados.
    customization.shipColor = hexStringToColorNumber(prefs.ship.colors.body);
    customization.boosterColor = hexStringToColorNumber(prefs.ship.colors.engine);
    if (prefs.ship && prefs.ship.colors && prefs.ship.colors.trail)
      garageTrailColor = hexStringToColorNumber(prefs.ship.colors.trail);
    else if (prefs.ship && prefs.ship.trail && prefs.ship.trail.color)
      garageTrailColor = hexStringToColorNumber(prefs.ship.trail.color);

    if (prefs.ship && prefs.ship.particles && typeof prefs.ship.particles.size === 'number')
      garageTrailSize = prefs.ship.particles.size;
    else if (prefs.ship && prefs.ship.trail && typeof prefs.ship.trail.size === 'number')
      garageTrailSize = prefs.ship.trail.size;

    if (prefs.ship && prefs.ship.material && prefs.ship.material.preset)
      garageMaterialPreset = prefs.ship.material.preset;
  }

  // Current customization state
  var customization = {
    shipColor: 0xffffff,       // Tint color for the ship body (white = no tint)
    boosterColor: 0x00a2ff     // Engine glow color
  };

  window.GarageRenderer = {

    // Initialize the garage scene
    init: function(containerElement) {
      if (garageRenderer) {
        console.warn('Garage renderer already initialized');
        return;
      }

      // Get container dimensions with fallback
      var width = containerElement.clientWidth;
      var height = containerElement.clientHeight;
      
      if (!width || width === 0) width = window.innerWidth * 0.9;
      if (!height || height === 0) height = window.innerHeight * 0.9;
      
      console.log('GarageRenderer init - dimensions:', width, 'x', height);

      // --- Create Scene ---
      garageScene = new THREE.Scene();

      // --- Create Camera ---
      garageCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
      garageCamera.position.set(0, 6, 18);
      garageCamera.lookAt(new THREE.Vector3(0, 0, 0));
      garageScene.add(garageCamera);

      // --- Create Renderer ---
      garageRenderer = new THREE.WebGLRenderer({ antialias: true });
      garageRenderer.setSize(width, height);

      if (typeof garageRenderer.setClearColorHex === 'function') {
        garageRenderer.setClearColorHex(0x0a0c10, 1);
      } else if (typeof garageRenderer.setClearColor === 'function') {
        garageRenderer.setClearColor(new THREE.Color(0x0a0c10), 1);
      }

      containerElement.appendChild(garageRenderer.domElement);

      try {
        var computedPos = window.getComputedStyle(containerElement).position;
        if (!computedPos || computedPos === 'static') {
          containerElement.style.position = 'relative';
        }
      } catch (e) {
        containerElement.style.position = 'relative';
      }

      var canvas = garageRenderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = '0';
      canvas.style.pointerEvents = 'auto';

      // --- Setup Orbit Controls ---
      garageOrbitControls = new THREE.OrbitControls(garageCamera, garageRenderer.domElement);
      garageOrbitControls.userRotate = true;
      garageOrbitControls.userZoom = true;
      garageOrbitControls.userPan = false;
      garageOrbitControls.minDistance = 8;
      garageOrbitControls.maxDistance = 35;
      garageOrbitControls.autoRotate = true;
      garageOrbitControls.autoRotateSpeed = 1.0;

      // --- Add Lighting ---
      this.setupLighting();

      // --- Create Display Platform ---
      this.createDisplayBase();

      // --- Load any saved customization ---
      this.loadCustomization();

      // --- Trail particle preview ---
      this.createTrailPreview();

      // --- Load Ship Model ---
      this.loadShipModel();

      // --- Start animation loop ---
      this.animate();

      // --- Handle window resize ---
      window.addEventListener('resize', GarageRenderer.onWindowResize);
    },


    // Setup dramatic garage lighting
    setupLighting: function() {
      var ambientLight = new THREE.AmbientLight(0x1a2040);
      garageScene.add(ambientLight);

      var keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
      keyLight.position.set(5, 15, 10);
      garageScene.add(keyLight);

      var fillLight = new THREE.DirectionalLight(0x4488cc, 0.5);
      fillLight.position.set(-10, 5, 5);
      garageScene.add(fillLight);

      var rimLight = new THREE.DirectionalLight(0x00ccff, 0.6);
      rimLight.position.set(0, 3, -12);
      garageScene.add(rimLight);

      // Undercarriage glow — this will change with booster color
      garageBoosterLight = new THREE.PointLight(customization.boosterColor, 2.0, 30);
      garageBoosterLight.position.set(0, -1, 0);
      garageScene.add(garageBoosterLight);

      var accentLight = new THREE.PointLight(0xff6633, 1.0, 40);
      accentLight.position.set(10, 8, 8);
      garageScene.add(accentLight);
    },


    // Load the Feisar ship geometry and textures
    loadShipModel: function() {
      var self = this;
      var jsonLoader = new THREE.JSONLoader();

      var statusEl = document.getElementById('garage-status');
      if (statusEl) statusEl.textContent = 'Cargando nave...';

      jsonLoader.load('geometries/ships/feisar/feisar.js', function(geometry) {
        console.log('GarageRenderer: Ship geometry loaded');

        try { geometry.computeTangents(); } catch(e) { console.warn('computeTangents skipped:', e); }

        var diffuseTexture = THREE.ImageUtils.loadTexture('textures.full/ships/feisar/diffuse.jpg');
        var specularTexture = THREE.ImageUtils.loadTexture('textures.full/ships/feisar/specular.jpg');
        var normalTexture = THREE.ImageUtils.loadTexture('textures.full/ships/feisar/normal.jpg');
        var reflectionTexture = THREE.ImageUtils.loadTextureCube([
          'textures.full/skybox/dawnclouds/px.jpg',
          'textures.full/skybox/dawnclouds/nx.jpg',
          'textures.full/skybox/dawnclouds/py.jpg',
          'textures.full/skybox/dawnclouds/ny.jpg',
          'textures.full/skybox/dawnclouds/pz.jpg',
          'textures.full/skybox/dawnclouds/nz.jpg'
        ]);

        var shipMaterial;
        try {
          if (typeof bkcore !== 'undefined' && bkcore.Utils && bkcore.Utils.createNormalMaterial) {
            shipMaterial = bkcore.Utils.createNormalMaterial({
              diffuse: diffuseTexture,
              specular: specularTexture,
              normal: normalTexture,
              cube: reflectionTexture,
              reflectivity: 0.9,
              ambient: 0x444444,
              shininess: 200,
              metal: true,
              perPixel: true
            });
          } else {
            throw new Error('bkcore.Utils not available');
          }
        } catch(e) {
          console.warn('GarageRenderer: Could not create custom shader material, falling back to MeshPhongMaterial', e);
          shipMaterial = new THREE.MeshPhongMaterial({
            map: diffuseTexture,
            specularMap: specularTexture,
            envMap: reflectionTexture,
            combine: THREE.MixOperation,
            reflectivity: 0.9,
            specular: new THREE.Color(0xe0e0e0),
            ambient: new THREE.Color(0x303030),
            shininess: 200,
            metal: true
          });
          // ensure env map mapping and update material
          try {
            if (reflectionTexture) reflectionTexture.mapping = THREE.CubeReflectionMapping;
            shipMaterial.needsUpdate = true;
          } catch(e) {}
        }

        var shipMesh = new THREE.Mesh(geometry, shipMaterial);

        garageShipGroup = new THREE.Object3D();
        garageShipGroup.add(shipMesh);
        garageShipGroup.position.set(0, 0, 0);
        garageShipGroup.scale.set(1, 1, 1);

        garageScene.add(garageShipGroup);

        if (garageOrbitControls && garageOrbitControls.center) {
          garageOrbitControls.center.set(0, 0, 0);
        }

        garageCamera.position.set(0, 6, 18);
        garageCamera.lookAt(new THREE.Vector3(0, 0, 0));

        garageMesh = shipMesh;

        if (statusEl) statusEl.textContent = '';

        // Apply saved customization to the loaded ship
        self.applyShipColor(customization.shipColor);
        self.applyBoosterColor(customization.boosterColor);
        self.applyMaterialPreset(garageMaterialPreset);

        console.log('GarageRenderer: Ship added to scene');
      });
    },


    // ═══════════════════════════════════════════════════
    //  COLOR CUSTOMIZATION API
    // ═══════════════════════════════════════════════════

    /**
     * Set the ship body tint color (real-time preview)
     * @param {number} hexColor — e.g. 0xff0000 for red
     */
    setShipColor: function(hexColor) {
      customization.shipColor = hexColor;
      this.applyShipColor(hexColor);
    },

    /**
     * Set the booster / engine glow color (real-time preview)
     * @param {number} hexColor — e.g. 0x00ff00 for green
     */
    setBoosterColor: function(hexColor) {
      customization.boosterColor = hexColor;
      this.applyBoosterColor(hexColor);
    },

    /**
     * Apply ship color to the material (handles both ShaderMaterial and Phong)
     */
    applyShipColor: function(hexColor) {
      if (!garageMesh || !garageMesh.material) return;

      var mat = garageMesh.material;

      // El preset "stealth" oscurece la pintura sin modificar el color guardado,
      // para que al volver a otro material se recupere el tono original.
      var displayColor = hexColor;
      var preset = bkcore.garage && bkcore.garage.MaterialPresets
        ? bkcore.garage.MaterialPresets.get(garageMaterialPreset) : null;
      if (preset && preset.diffuseMultiplier !== undefined && preset.diffuseMultiplier < 1.0) {
        var dm = preset.diffuseMultiplier;
        displayColor = (Math.round(((hexColor >> 16) & 0xff) * dm) << 16) |
                       (Math.round(((hexColor >> 8)  & 0xff) * dm) << 8)  |
                        Math.round( (hexColor         & 0xff) * dm);
      }

      // ShaderMaterial (from createNormalMaterial) — use uniforms
      if (mat instanceof THREE.ShaderMaterial && mat.uniforms && mat.uniforms['uDiffuseColor']) {
        mat.uniforms['uDiffuseColor'].value.setHex(displayColor);
      }
      // MeshPhongMaterial — use color property
      else if (mat.color && typeof mat.color.setHex === 'function') {
        mat.color.setHex(displayColor);
      }

      console.log('GarageRenderer: Ship color set to 0x' + hexColor.toString(16));
    },

    /**
     * Apply booster color to the under-light and any glow elements
     */
    applyBoosterColor: function(hexColor) {
      if (garageBoosterLight) {
        garageBoosterLight.color.setHex(hexColor);
      }
      console.log('GarageRenderer: Booster color set to 0x' + hexColor.toString(16));
    },

    /**
     * Set the active ship material preset (real-time preview)
     * @param {string} presetId
     */
    setMaterialPreset: function(presetId) {
      garageMaterialPreset = presetId;
      garageRainbowTime = 0;
      this.applyMaterialPreset(presetId);
      // applyMaterialPreset calls applyShipColor which handles darkening/restore automatically
    },

    /**
     * Apply the material preset to the existing ship material instance.
     */
    applyMaterialPreset: function(presetId) {
      if (!garageMesh || !garageMesh.material) return;

      if (bkcore.garage && bkcore.garage.MaterialPresets) {
        bkcore.garage.MaterialPresets.applyToMaterial(garageMesh.material, presetId);
      }
      // Re-apply ship color so diffuseMultiplier (stealth darkening) or restoration takes effect
      this.applyShipColor(customization.shipColor);
      console.log('GarageRenderer: Material preset set to ' + presetId);
    },


    /**
     * Create a continuous particle trail preview in the garage scene
     */
    createTrailPreview: function() {
      if (!garageScene || typeof bkcore === 'undefined' || !bkcore.threejs || !bkcore.threejs.Particles) return;

      var texCloud = null;
      if (THREE.ImageUtils && THREE.ImageUtils.loadTexture) {
         texCloud = THREE.ImageUtils.loadTexture("textures/particles/cloud.png");
      }

      var leftTrail = new bkcore.threejs.Particles({
        max: 200,
        spawnRate: 2,
        tint: garageTrailColor,
        color: 0xffffff,
        color2: 0xffffff,
        texture: texCloud,
        size: garageTrailSize * 1.5,
        life: 40,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        spawn: new THREE.Vector3(1.2, 0.2, -3.5),
        spawnRadius: new THREE.Vector3(0.05, 0.05, 0.05),
        velocity: new THREE.Vector3(0, 0, -1.0),
        randomness: new THREE.Vector3(0.05, 0.05, 0.05),
        force: new THREE.Vector3(0, 0, 0),
        friction: 0.98
      });

      var rightTrail = new bkcore.threejs.Particles({
        max: 200,
        spawnRate: 2,
        tint: garageTrailColor,
        color: 0xffffff,
        color2: 0xffffff,
        texture: texCloud,
        size: garageTrailSize * 1.5,
        life: 40,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        spawn: new THREE.Vector3(-1.2, 0.2, -3.5),
        spawnRadius: new THREE.Vector3(0.05, 0.05, 0.05),
        velocity: new THREE.Vector3(0, 0, -1.0),
        randomness: new THREE.Vector3(0.05, 0.05, 0.05),
        force: new THREE.Vector3(0, 0, 0),
        friction: 0.98
      });

      garageScene.add(leftTrail.system);
      garageScene.add(rightTrail.system);

      garageTrailParticles = {
        left: leftTrail,
        right: rightTrail,
        setTint: function(hex) {
          this.left.setTint(hex);
          this.right.setTint(hex);
        },
        update: function(dt) {
          this.left.update(dt);
          this.right.update(dt);
        }
      };
    },

    /**
     * Update the trail preview color in real time
     * @param {number} hexColor
     */
    setTrailColor: function(hexColor) {
      garageTrailColor = hexColor;
      if (garageTrailParticles) {
        garageTrailParticles.setTint(hexColor);
      }
    },

    /**
     * Update the trail preview particle size in real time
     * @param {number} size
     */
    setTrailSize: function(size) {
      garageTrailSize = size;
      if (garageTrailParticles) {
        garageTrailParticles.left.setSize(size * 1.5);
        garageTrailParticles.right.setSize(size * 1.5);
      }
    },

    /**
     * Get the current customization state
     * @returns {{ shipColor: number, boosterColor: number }}
     */
    getCustomization: function() {
      return {
        shipColor: customization.shipColor,
        boosterColor: customization.boosterColor,
        trailColor: garageTrailColor,
        trailSize: garageTrailSize,
        materialPreset: garageMaterialPreset
      };
    },


    /**
     * Save current customization to localStorage
     */
    saveCustomization: function() {
      var preferences = getGaragePreferences();
      if (!preferences) {
        console.warn('GarageRenderer: GaragePreferences module is not available');
        return false;
      }

      var data = {
        ship: {
          colors: {
            body: colorNumberToHexString(customization.shipColor),
            engine: colorNumberToHexString(customization.boosterColor),
            trail: colorNumberToHexString(garageTrailColor)
          },
          material: {
            preset: garageMaterialPreset
          },
          particles: {
            size: garageTrailSize
          }
        }
      };

      var success = preferences.save(data);
      if (success) console.log('GarageRenderer: Customization saved', data);
      return success;
    },


    /**
     * Load customization from localStorage (called on init)
     */
    loadCustomization: function() {
      var preferences = getGaragePreferences();
      if (!preferences) {
        console.warn('GarageRenderer: GaragePreferences module is not available');
        return;
      }

      applyPrefsToCustomization(preferences.load());
      console.log('GarageRenderer: Customization loaded', customization);
    },


    // ═══════════════════════════════════════════════════
    //  ANIMATION & LIFECYCLE
    // ═══════════════════════════════════════════════════

    animate: function() {
      garageAnimId = requestAnimationFrame(GarageRenderer.animate);

      if (garageOrbitControls && typeof garageOrbitControls.update === 'function') {
        garageOrbitControls.update();
      }

      if (garageTrailParticles) {
        garageTrailParticles.update(1.0);
      }

      if (garageMaterialPreset === 'holographic' && garageMesh && garageMesh.material && garageMesh.material.uniforms) {
        garageRainbowTime += 0.006;
        var uniforms = garageMesh.material.uniforms;

        // El efecto holografico solo anima uniforms de shader; en materiales
        // fallback se conserva el preset estatico aplicado previamente.
        var hue1 = (garageRainbowTime * 0.38) % 1.0;
        var hue2 = (garageRainbowTime * 1.1 + 0.33) % 1.0;
        var pulse = 0.5 + 0.5 * Math.sin(garageRainbowTime * 2.2);

        // Ambient: bright cycling color on all lit surfaces
        if (uniforms.uAmbientColor)
          uniforms.uAmbientColor.value.setHex(hslToHex(hue1, 1.0, 0.28 + 0.10 * pulse));

        // Specular: fast rainbow shimmer on highlights
        if (uniforms.uSpecularColor)
          uniforms.uSpecularColor.value.setHex(hslToHex(hue2, 1.0, 0.60));

        // Diffuse tint: blend base ship color with rainbow — this is the main visible effect
        if (uniforms.uDiffuseColor) {
          var baseR = (customization.shipColor >> 16) & 0xff;
          var baseG = (customization.shipColor >> 8) & 0xff;
          var baseB = customization.shipColor & 0xff;
          var rainbowHex = hslToHex(hue1, 1.0, 0.50);
          var rR = (rainbowHex >> 16) & 0xff;
          var rG = (rainbowHex >> 8) & 0xff;
          var rB = rainbowHex & 0xff;
          var strength = 0.30 + 0.12 * pulse;
          uniforms.uDiffuseColor.value.setHex(
            (Math.round(baseR * (1 - strength) + rR * strength) << 16) |
            (Math.round(baseG * (1 - strength) + rG * strength) << 8) |
             Math.round(baseB * (1 - strength) + rB * strength)
          );
        }
      }

      garageRenderer.render(garageScene, garageCamera);
    },

    onWindowResize: function() {
      if (!garageRenderer) return;

      var viewport = document.getElementById('garage-viewport');
      if (!viewport) return;

      var width = viewport.clientWidth || window.innerWidth * 0.9;
      var height = viewport.clientHeight || window.innerHeight * 0.8;

      garageCamera.aspect = width / height;
      garageCamera.updateProjectionMatrix();
      garageRenderer.setSize(width, height);
    },

    createDisplayBase: function() {
      var platformGeo = new THREE.CylinderGeometry(10, 10, 0.3, 64);
      var platformMat = new THREE.MeshPhongMaterial({
        color: 0x0d1117,
        specular: new THREE.Color(0x222233),
        shininess: 80,
        ambient: new THREE.Color(0x050508)
      });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.y = -3.15;
      garageScene.add(platform);

      var ringGeo = new THREE.TorusGeometry(10, 0.08, 8, 64);
      var ringMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -3.0;
      garageScene.add(ring);

      var innerRingGeo = new THREE.TorusGeometry(7, 0.04, 8, 64);
      var innerRingMat = new THREE.MeshBasicMaterial({ color: 0x0066aa });
      var innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = -2.99;
      garageScene.add(innerRing);

      var floorGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
      var floorMat = new THREE.MeshBasicMaterial({ color: 0x0a1020, wireframe: true });
      var floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -3.3;
      garageScene.add(floor);
    },

    getShipMesh: function() {
      return garageMesh;
    },

    getShipGroup: function() {
      return garageShipGroup;
    },

    destroy: function() {
      if (!garageRenderer) return;

      if (garageAnimId) {
        cancelAnimationFrame(garageAnimId);
        garageAnimId = null;
      }

      garageOrbitControls = null;

      if (garageRenderer.domElement && garageRenderer.domElement.parentNode) {
        garageRenderer.domElement.parentNode.removeChild(garageRenderer.domElement);
      }

      garageScene = null;
      garageCamera = null;
      garageRenderer = null;
      garageMesh = null;
      garageShipGroup = null;
      garageOrbitControls = null;
      garageBoosterLight = null;
      garageTrailParticles = null;

      window.removeEventListener('resize', GarageRenderer.onWindowResize);
    }
  };
})();
