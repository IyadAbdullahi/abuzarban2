const fs = require("fs");
const path = require("path");
const os = require("os");

function getBaseDataDir() {
  // Prefer Electron-provided APPDATA override; fallback to userData-like path
  const envBase = process.env.APPDATA;
  if (envBase && typeof envBase === "string" && envBase.trim().length > 0) {
    return envBase;
  }
  // Fallback creates an app-specific directory in the user's home
  return path.join(os.homedir(), "abuzarban-school");
}

function getDbDir() {
  return path.join(getBaseDataDir(), "POS", "server", "databases");
}

function getUploadsDir() {
  return path.join(getBaseDataDir(), "POS", "uploads");
}

function ensureDataDirsExist() {
  try {
    fs.mkdirSync(getDbDir(), { recursive: true });
    fs.mkdirSync(getUploadsDir(), { recursive: true });
  } catch (error) {
    // Log and continue; creation will be attempted again on next calls
    console.error("Failed to create data directories:", error);
  }
}

function getNeDbFilePath(fileName) {
  ensureDataDirsExist();
  return path.join(getDbDir(), fileName);
}

module.exports = {
  getBaseDataDir,
  getDbDir,
  getUploadsDir,
  ensureDataDirsExist,
  getNeDbFilePath,
};


