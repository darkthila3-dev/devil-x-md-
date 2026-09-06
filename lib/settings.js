const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');
const EDITABLE_KEYS = ['BOT_NAME', 'FOOTER', 'PREFIX', 'OWNER_NUMBER'];

function readSettingsFile() {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch (err) {
    console.error('[SETTINGS] Failed to parse settings.json:', err.message);
    return {};
  }
}

function writeSettingsFile(updates) {
  const existing = readSettingsFile();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...existing, ...updates }, null, 2));
}

/**
 * Loads settings.json (if it exists) and applies it on top of the
 * defaults from config.js / .env. Called once at startup.
 *
 * Also generates a fresh, random dashboard password the very first
 * time the bot runs (instead of everyone sharing one fixed password
 * from .env) and persists it so it survives restarts.
 */
function loadSettings() {
  const saved = readSettingsFile();
  Object.assign(config, saved);

  if (Object.keys(saved).length) {
    console.log('[SETTINGS] Loaded saved settings from settings.json');
  }

  if (!saved.DASHBOARD_PASSWORD) {
    const generated = crypto.randomBytes(4).toString('hex'); // e.g. "a13f9c02"
    config.DASHBOARD_PASSWORD = generated;
    writeSettingsFile({ DASHBOARD_PASSWORD: generated });
    console.log('[SETTINGS] Generated a new dashboard password.');
  }
}

/**
 * Applies and persists an update to editable settings.
 * Mutates the shared config object in place, so every plugin
 * (which already holds a reference to it) picks up the change
 * immediately, with no restart needed.
 */
function saveSettings(updates) {
  const filtered = {};
  for (const key of EDITABLE_KEYS) {
    if (updates[key] !== undefined && String(updates[key]).trim() !== '') {
      filtered[key] = updates[key];
    }
  }

  Object.assign(config, filtered);
  writeSettingsFile(filtered);
  return filtered;
}

function getEditableSettings() {
  const out = {};
  for (const key of EDITABLE_KEYS) out[key] = config[key];
  return out;
}

module.exports = { loadSettings, saveSettings, getEditableSettings, EDITABLE_KEYS };
