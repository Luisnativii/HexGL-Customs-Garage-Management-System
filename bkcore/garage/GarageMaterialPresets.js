/*
 * HexGL Garage Material Presets
 * Applies garage material looks to existing Three.js material instances.
 */

var bkcore = bkcore || {};
bkcore.garage = bkcore.garage || {};

bkcore.garage.MaterialPresets = (function() {
	var DEFAULT_PRESET = 'metallic';

	var PRESETS = {
		metallic: {
			label: 'Metálico',
			metal: true,
			shininess: 42,
			specular: 0xe0e0e0,
			reflectivity: 0.9
		},
		matte: {
			label: 'Mate',
			metal: false,
			shininess: 6,
			specular: 0x111111,
			reflectivity: 0.15
		},
		holographic: {
			label: 'Holográfico',
			metal: true,
			shininess: 120,
			specular: 0x00ffff,
			reflectivity: 1.0
		},
		stealth: {
			label: 'Sigilo',
			metal: false,
			shininess: 1,
			specular: 0x0a0a0a,
			reflectivity: 0.05
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

		if(material.uniforms)
		{
			setUniformValue(material.uniforms.uShininess, preset.shininess);
			setUniformColor(material.uniforms.uSpecularColor, preset.specular);
			setUniformValue(material.uniforms.uReflectivity, preset.reflectivity);
		}

		if(material.specular && typeof material.specular.setHex === 'function')
			material.specular.setHex(preset.specular);

		if(material.shininess !== undefined)
			material.shininess = preset.shininess;

		if(material.reflectivity !== undefined)
			material.reflectivity = preset.reflectivity;

		if(material.metal !== undefined)
			material.metal = preset.metal;

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
