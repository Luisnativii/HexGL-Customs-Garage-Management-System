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
 * HexGL Garage Preferences
 * Local persistence for browser-only garage customization.
 */

var bkcore = bkcore || {};
bkcore.garage = bkcore.garage || {};

bkcore.garage.GaragePreferences = (function() {
	var STORAGE_KEY = 'hexgl:userPrefs';
	var SCHEMA_VERSION = 1;
	var HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
	var VALID_MATERIAL_PRESETS = {
		metallic: true,
		matte: true,
		holographic: true,
		stealth: true
	};
	var PARTICLE_SIZE_MIN = 0.5;
	var PARTICLE_SIZE_MAX = 4.0;

	var DEFAULTS = {
		schemaVersion: SCHEMA_VERSION,
		lastUpdated: null,
		ship: {
			colors: {
				body: '#ffffff',
				engine: '#00a2ff',
				trail: '#ffffff'
			},
			material: {
				preset: 'metallic'
			},
			particles: {
				size: 2
			}
		}
	};

	function clone(obj)
	{
		return JSON.parse(JSON.stringify(obj));
	}

	function warn(message, error)
	{
		try {
			if(error !== undefined)
				console.warn(message, error);
			else
				console.warn(message);
		} catch(e) {}
	}

	function isHexColor(value)
	{
		return typeof value === 'string' && HEX_COLOR_RE.test(value);
	}

	function normalizeColor(value)
	{
		return isHexColor(value) ? value.toLowerCase() : null;
	}

	function getStoredColors(prefs)
	{
		if(!prefs || !prefs.ship || !prefs.ship.colors)
			return {};

		return prefs.ship.colors;
	}

	function isValidPreset(value)
	{
		return typeof value === 'string' && VALID_MATERIAL_PRESETS[value] === true;
	}

	function isValidParticleSize(value)
	{
		return typeof value === 'number' && isFinite(value) && value >= PARTICLE_SIZE_MIN && value <= PARTICLE_SIZE_MAX;
	}

	function buildPrefs(prefs, options)
	{
		var defaults = clone(DEFAULTS);
		var storedColors = getStoredColors(prefs);
		var body = normalizeColor(storedColors.body);
		var engine = normalizeColor(storedColors.engine);
		var trail = normalizeColor(storedColors.trail);

		// Mantiene compatibilidad con preferencias guardadas antes de separar
		// el rastro en colors.trail y particles.size.
		var legacyTrail = (prefs && prefs.ship && prefs.ship.trail) ? prefs.ship.trail : {};
		var legacyTrailColor = normalizeColor(legacyTrail.color);
		var storedMaterial = (prefs && prefs.ship && prefs.ship.material) ? prefs.ship.material : {};
		var storedParticles = (prefs && prefs.ship && prefs.ship.particles) ? prefs.ship.particles : {};
		var materialPreset = isValidPreset(storedMaterial.preset) ? storedMaterial.preset : DEFAULTS.ship.material.preset;
		var particleSize = isValidParticleSize(storedParticles.size) ? storedParticles.size : DEFAULTS.ship.particles.size;

		if(!isValidParticleSize(storedParticles.size) && isValidParticleSize(legacyTrail.size))
			particleSize = legacyTrail.size;

		if(options && options.warnInvalidColors)
		{
			if(!prefs || !prefs.ship || !prefs.ship.colors)
				warn('GaragePreferences: Missing ship.colors preferences, using defaults.');
			if(storedColors.body !== undefined && !body)
				warn('GaragePreferences: Invalid ship body color, using default.');
			if(storedColors.engine !== undefined && !engine)
				warn('GaragePreferences: Invalid engine color, using default.');
			if(storedColors.trail !== undefined && !trail)
				warn('GaragePreferences: Invalid trail color, using default.');
			if(legacyTrail.color !== undefined && !legacyTrailColor && storedColors.trail === undefined)
				warn('GaragePreferences: Invalid legacy trail color, using default.');
			if(storedMaterial.preset !== undefined && !isValidPreset(storedMaterial.preset))
				warn('GaragePreferences: Invalid material preset, using default.');
			if(storedParticles.size !== undefined && !isValidParticleSize(storedParticles.size))
				warn('GaragePreferences: Invalid particle size, using default.');
		}

		// La salida siempre usa el esquema actual; asi el resto de la app
		// puede leer una estructura estable aunque el localStorage venga parcial.
		defaults.schemaVersion = SCHEMA_VERSION;
		defaults.lastUpdated = prefs && typeof prefs.lastUpdated === 'string'
			? prefs.lastUpdated
			: new Date().toISOString();
		defaults.ship.colors.body = body || DEFAULTS.ship.colors.body;
		defaults.ship.colors.engine = engine || DEFAULTS.ship.colors.engine;
		defaults.ship.colors.trail = trail || legacyTrailColor || DEFAULTS.ship.colors.trail;
		defaults.ship.material.preset = materialPreset;
		defaults.ship.particles.size = particleSize;

		return defaults;
	}

	return {
		key: STORAGE_KEY,
		schemaVersion: SCHEMA_VERSION,

		getDefaults: function()
		{
			return clone(DEFAULTS);
		},

		isAvailable: function()
		{
			try {
				if(typeof window === 'undefined' || !window.localStorage)
					return false;

				var testKey = STORAGE_KEY + ':test';
				window.localStorage.setItem(testKey, '1');
				window.localStorage.removeItem(testKey);
				return true;
			} catch(e) {
				return false;
			}
		},

		load: function()
		{
			try {
				if(!this.isAvailable())
					return this.getDefaults();

				var raw = window.localStorage.getItem(STORAGE_KEY);
				if(!raw)
					return this.getDefaults();

				var prefs = JSON.parse(raw);
				if(!prefs || prefs.schemaVersion !== SCHEMA_VERSION)
				{
					warn('GaragePreferences: Unsupported or missing schemaVersion, using defaults.');
					return this.getDefaults();
				}

				return buildPrefs(prefs, { warnInvalidColors: true });
			} catch(e) {
				warn('GaragePreferences: Could not load saved preferences, using defaults.', e);
				return this.getDefaults();
			}
		},

		save: function(prefs)
		{
			try {
				if(!this.isAvailable())
					return false;

				var normalized = buildPrefs(prefs, { warnInvalidColors: true });
				normalized.lastUpdated = new Date().toISOString();

				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
				return true;
			} catch(e) {
				warn('GaragePreferences: Could not save preferences.', e);
				return false;
			}
		},

		clear: function()
		{
			try {
				if(!this.isAvailable())
					return false;

				window.localStorage.removeItem(STORAGE_KEY);
				return true;
			} catch(e) {
				warn('GaragePreferences: Could not clear preferences.', e);
				return false;
			}
		}
	};
})();
