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

	var DEFAULTS = {
		schemaVersion: SCHEMA_VERSION,
		lastUpdated: null,
		ship: {
			colors: {
				body: '#ffffff',
				engine: '#00a2ff'
			},
			trail: {
				color: '#ffffff',
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

	function buildPrefs(prefs, options)
	{
		var defaults = clone(DEFAULTS);
		var storedColors = getStoredColors(prefs);
		var body = normalizeColor(storedColors.body);
		var engine = normalizeColor(storedColors.engine);

		var storedTrail = (prefs && prefs.ship && prefs.ship.trail) ? prefs.ship.trail : {};
		var trailColor = normalizeColor(storedTrail.color);
		var trailSize = typeof storedTrail.size === 'number' ? storedTrail.size : DEFAULTS.ship.trail.size;

		if(options && options.warnInvalidColors)
		{
			if(!prefs || !prefs.ship || !prefs.ship.colors)
				warn('GaragePreferences: Missing ship.colors preferences, using defaults.');
			if(storedColors.body !== undefined && !body)
				warn('GaragePreferences: Invalid ship body color, using default.');
			if(storedColors.engine !== undefined && !engine)
				warn('GaragePreferences: Invalid engine color, using default.');
		}

		defaults.schemaVersion = SCHEMA_VERSION;
		defaults.lastUpdated = prefs && typeof prefs.lastUpdated === 'string'
			? prefs.lastUpdated
			: new Date().toISOString();
		defaults.ship.colors.body = body || DEFAULTS.ship.colors.body;
		defaults.ship.colors.engine = engine || DEFAULTS.ship.colors.engine;
		defaults.ship.trail.color = trailColor || DEFAULTS.ship.trail.color;
		defaults.ship.trail.size = trailSize;

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
