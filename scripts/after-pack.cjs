const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const UNUSED_PRIVACY_KEYS = [
  "NSMicrophoneUsageDescription",
  "NSAudioCaptureUsageDescription",
  "NSBluetoothAlwaysUsageDescription",
  "NSBluetoothPeripheralUsageDescription",
];

function findAppBundle(appOutDir) {
  return fs
    .readdirSync(appOutDir)
    .find((item) => item.endsWith(".app"));
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const appName = findAppBundle(context.appOutDir);
  if (!appName) {
    return;
  }

  const infoPlistPath = path.join(context.appOutDir, appName, "Contents", "Info.plist");
  if (!fs.existsSync(infoPlistPath)) {
    return;
  }

  UNUSED_PRIVACY_KEYS.forEach((key) => {
    try {
      execFileSync("plutil", ["-remove", key, infoPlistPath], { stdio: "ignore" });
    } catch {
      // The key is optional; ignore when Electron stops adding it.
    }
  });

  execFileSync("plutil", ["-lint", infoPlistPath], { stdio: "inherit" });
};
