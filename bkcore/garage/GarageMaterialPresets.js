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

/*
 * HexGL Garage Material Presets
 * Applies garage material looks to existing Three.js material instances.
 */

var bkcore = bkcore || {};
bkcore.garage = bkcore.garage || {};

bkcore.garage.MaterialPresets = (function() {
	var DEFAULT_PRESET = 'metallic';

	// Cada preset solo describe propiedades de material; el color base lo sigue controlando GarageRenderer.
	var PRESETS = {
		metallic: {
			label: 'Metálico',
			metal: true,
			shininess: 42,
			specular: 0xe0e0e0,
			reflectivity: 0.9,
			ambientColor: 0xffffff,
			diffuseMultiplier: 1.0
		},
		matte: {
			label: 'Mate',
			metal: false,
			shininess: 8,
			specular: 0x282828,
			reflectivity: 0.12,
			ambientColor: 0xffffff,
			diffuseMultiplier: 1.0
		},
		holographic: {
			label: 'Holográfico',
			metal: true,
			shininess: 120,
			specular: 0x00ffff,
			reflectivity: 1.0,
			ambientColor: 0x005577,
			diffuseMultiplier: 1.0
		},
		stealth: {
			label: 'Sigilo',
			metal: false,
			shininess: 1,
			specular: 0x080808,
			reflectivity: 0.02,
			// Black ambient + heavy diffuse darkening = light-absorbing surface
			ambientColor: 0x000000,
			diffuseMultiplier: 0.13
		}
	};

	function getPreset(id)
	{
		return PRESETS[id] || PRESETS[DEFAULT_PRESET];
	}

	function setUniformColor(uniform, hexColor)
	{
		if(uniform && uniform.value && typeof uniform.value.setHex === 'function')
			uniform.value.setHex(hexColor);
	}

	function setUniformValue(uniform, value)
	{
		if(uniform)
			uniform.value = value;
	}

	function applyToMaterial(material, presetId)
	{
		if(!material) return;

		var preset = getPreset(presetId);

		// Los materiales del juego pueden ser ShaderMaterial o MeshPhongMaterial segun el entorno de carga.
		if(material.uniforms)
		{
			setUniformValue(material.uniforms.uShininess, preset.shininess);
			setUniformColor(material.uniforms.uSpecularColor, preset.specular);
			setUniformValue(material.uniforms.uReflectivity, preset.reflectivity);
			if(preset.ambientColor !== undefined)
				setUniformColor(material.uniforms.uAmbientColor, preset.ambientColor);
		}

		if(material.specular && typeof material.specular.setHex === 'function')
			material.specular.setHex(preset.specular);

		if(material.shininess !== undefined)
			material.shininess = preset.shininess;

		if(material.reflectivity !== undefined)
			material.reflectivity = preset.reflectivity;

		if(material.metal !== undefined)
			material.metal = preset.metal;

		// Three.js r53 necesita esta marca para recalcular el material tras cambiar propiedades en caliente.
		material.needsUpdate = true;
	}

	return {
		defaultPreset: DEFAULT_PRESET,
		presets: PRESETS,

		isValid: function(id)
		{
			return typeof id === 'string' && PRESETS[id] !== undefined;
		},

		get: getPreset,
		applyToMaterial: applyToMaterial
	};
})();
